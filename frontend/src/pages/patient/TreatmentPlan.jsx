import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { ClipboardList, Calendar, User, Clock, AlertCircle, FileText, CheckCircle, Activity, ChevronRight, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const TreatmentPlan = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreatmentPlans();
  }, []);

  const fetchTreatmentPlans = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/patients/treatment-plans', config);
      setPlans(data.data || []);
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
      toast.error('Failed to load your treatment plans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <Activity className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          Loading your treatment plans...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ClipboardList className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Treatment Plans</h1>
          <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
            Review the personalized medical instructions and recovery paths prescribed by your doctors.
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No Treatment Plans</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            You don't have any active treatment plans at the moment. Your doctors will assign them here when necessary.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
              
              {/* Card Header */}
              <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{plan.title}</h2>
                    <div className="flex items-center text-sm text-gray-500 gap-4 mt-1 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        {new Date(plan.startDate).toLocaleDateString()}
                        {plan.endDate && ` - ${new Date(plan.endDate).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border shadow-sm ${getStatusColor(plan.status)}`}>
                  {getStatusIcon(plan.status)}
                  {plan.status}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  
                  {/* Doctor Info */}
                  <div className="md:col-span-1 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prescribing Doctor</h4>
                    <div className="flex items-center gap-3">
                      {plan.doctor?.user?.avatar ? (
                        <img 
                          src={plan.doctor.user.avatar} 
                          alt="Doctor" 
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-sm">Dr. {plan.doctor?.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 font-medium">Care Provider</p>
                      </div>
                    </div>
                  </div>

                  {/* Plan Details */}
                  <div className="md:col-span-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Treatment Instructions</h4>
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                        {plan.description || "No detailed instructions provided."}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentPlan;

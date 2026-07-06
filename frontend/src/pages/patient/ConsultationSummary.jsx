import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calendar, ShieldAlert, Pill, CheckCircle2, ChevronLeft } from 'lucide-react';

const ConsultationSummary = () => {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await API.get(`/api/consultations/appointment/${appointmentId}`, config);
        setConsultation(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Could not load consultation summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [appointmentId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Summary Unavailable</h2>
        <p className="text-gray-500 mb-6">{error || "Consultation summary not found."}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Summary</h1>
          <p className="text-gray-500 mt-1">Review your doctor's advice and treatment plan.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="p-6 md:p-8 bg-indigo-50 border-b border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {consultation.doctor?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dr. {consultation.doctor?.name}</h2>
              <p className="text-indigo-600 font-medium">{new Date(consultation.createdAt).toLocaleDateString()} • Video Consultation</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Explanation */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> Explanation of Problem
            </h3>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <p className="text-gray-800 leading-relaxed font-medium">
                {consultation.simpleExplanation || "No explanation provided by the doctor."}
              </p>
            </div>
          </div>

          {/* Treatment Advice & Medicines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Treatment Advice
              </h3>
              <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100 h-full">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {consultation.treatmentAdvice || "No specific treatment advice provided."}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-500" /> Tests Needed
              </h3>
              <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 h-full">
                {consultation.testsNeeded ? (
                  <ul className="list-disc list-inside text-gray-800 space-y-2">
                    {consultation.testsNeeded.split(',').map((test, i) => (
                      <li key={i} className="font-medium">{test.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No tests requested.</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency & Follow Up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Emergency Warning Signs
              </h3>
              <div className="bg-red-50 rounded-2xl p-5 border border-red-100 h-full">
                <p className="text-red-800 font-medium">
                  {consultation.emergencySigns || "None specified. If you feel severe discomfort, visit an emergency room."}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" /> Follow-up Details
              </h3>
              <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 h-full">
                <p className="text-purple-900 font-medium">
                  {consultation.followUpDate ? (
                    <>Your doctor requested a follow up on <span className="font-bold">{new Date(consultation.followUpDate).toLocaleDateString()}</span>.</>
                  ) : (
                    "No follow up required at this time."
                  )}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ConsultationSummary;

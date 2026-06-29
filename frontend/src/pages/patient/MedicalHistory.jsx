import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, Stethoscope, Clock, FileText, FlaskConical, Calendar, ChevronRight } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const MedicalHistory = () => {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyDiagnoses = async () => {
      try {
        const { data } = await API.get('/api/medical/my-diagnoses', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDiagnoses(data.data || []);
      } catch (err) {
        console.error("Failed to fetch medical history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyDiagnoses();
  }, [user.token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-teal-600" /> Medical History
          </h1>
          <p className="text-gray-500 mt-1">Your comprehensive health record and medical timeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-500" /> Known Conditions
            </h2>
            {diagnoses.length === 0 ? (
              <p className="text-sm text-gray-500">No conditions recorded.</p>
            ) : (
              <ul className="space-y-3">
                {[...new Set(diagnoses.map(d => d.primaryDiagnosis))].map((condition, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 mr-2"></span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{condition}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="bg-teal-50 rounded-xl p-5 border border-teal-100">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                   <Activity size={20} />
                </div>
                <div>
                   <h3 className="font-bold text-teal-900">Total Records</h3>
                   <p className="text-teal-700 text-sm">{diagnoses.length} Diagnoses</p>
                </div>
             </div>
          </div>

        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-teal-600" /> Health Timeline
            </h2>

            {diagnoses.length === 0 ? (
              <div className="text-center py-10">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-900 font-bold">No Medical History Found</h3>
                <p className="text-gray-500 text-sm mt-1">Your doctor will add your diagnoses here after consultations.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                {diagnoses.map((d, index) => {
                  const date = new Date(d.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                  const colorClass = d.riskLevel === 'High' ? 'red' : d.riskLevel === 'Low' ? 'green' : 'blue';
                  
                  return (
                    <div key={d._id} className="relative pl-6">
                      <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-white border-2 border-${colorClass}-500 flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-full bg-${colorClass}-500`}></div>
                      </div>
                      <div>
                        <span className={`text-xs font-bold text-${colorClass}-600 bg-${colorClass}-50 px-2 py-1 rounded`}>{date}</span>
                        <h3 className="text-md font-bold text-gray-900 mt-2">{d.primaryDiagnosis}</h3>
                        <p className="text-sm text-gray-600 mt-1">Dr. {d.doctor?.user?.name || 'Unknown'} • Risk: {d.riskLevel}</p>
                        
                        <div className="mt-3 space-y-2">
                          {d.symptoms && d.symptoms.length > 0 && d.symptoms[0] !== "" && (
                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 flex items-start">
                              <AlertTriangle className="w-4 h-4 mr-2 text-orange-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-gray-900 block mb-1">Symptoms</span>
                                <p>{d.symptoms.join(', ')}</p>
                              </div>
                            </div>
                          )}
                          
                          {d.treatmentAdvice && (
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700 flex items-start">
                              <Stethoscope className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-blue-900 block mb-1">Treatment Plan & Advice</span>
                                <p className="text-blue-800">{d.treatmentAdvice}</p>
                              </div>
                            </div>
                          )}

                          {d.labRecommendations && d.labRecommendations.length > 0 && d.labRecommendations[0] !== "" && (
                            <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg text-sm text-gray-700 flex items-start">
                              <FlaskConical className="w-4 h-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-purple-900 block mb-1">Recommended Tests</span>
                                <p className="text-purple-800">{d.labRecommendations.join(', ')}</p>
                              </div>
                            </div>
                          )}

                          {d.followUpDate && (
                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm text-gray-700 flex items-start">
                              <Calendar className="w-4 h-4 mr-2 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-emerald-900 block mb-1">Follow-up Needed</span>
                                <p className="text-emerald-800">{new Date(d.followUpDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MedicalHistory;

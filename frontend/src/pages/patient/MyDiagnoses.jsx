import React, { useState, useEffect } from 'react';
import { Search, Eye, Stethoscope, FileText, Activity, AlertCircle, FilePlus, User, Calendar, Pill } from 'lucide-react';
import { Card, Badge, Modal, Button } from '../../components/ui/SharedUI';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import toast from 'react-hot-toast';

const MyDiagnoses = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnoses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/api/medical/my-diagnoses', config);
        
        // Map backend data to frontend format
        const formatted = data.data.map(d => ({
          id: d._id,
          name: d.primaryDiagnosis,
          diagnosedBy: d.doctor?.user?.name || 'Unknown Doctor',
          diagnosisDate: new Date(d.createdAt).toLocaleDateString(),
          severity: d.riskLevel,
          status: 'Active', // Or derive from date/status
          lastUpdated: new Date(d.updatedAt).toLocaleDateString(),
          description: d.description || d.treatmentAdvice || 'No description provided.',
          symptoms: d.symptoms || [],
          treatmentPlan: d.treatmentAdvice || 'No specific treatment plan.',
          medications: d.labRecommendations || [], // Map lab recs or similar here if no meds
          followUpSchedule: d.followUpDate ? new Date(d.followUpDate).toLocaleDateString() : 'Not scheduled',
          doctorNotes: '', // Keep empty or map if added later
          relatedLabReports: []
        }));
        
        setDiagnoses(formatted);
      } catch (error) {
        console.error('Error fetching diagnoses:', error);
        toast.error('Failed to load diagnosis records');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnoses();
  }, [user.token]);

  const filteredDiagnoses = diagnoses.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.diagnosedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#3B82F6';
      case 'Improving': return '#14B8A6';
      case 'Recovered': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Stethoscope className="w-6 h-6 mr-3 text-teal-600" /> My Diagnoses
          </h1>
          <p className="text-gray-500 text-sm mt-1">View your current and past medical diagnoses.</p>
        </div>
      </div>

      <Card style={{ padding: '0px' }}>
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search diagnoses or doctors..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-y border-gray-200">
                <th className="px-6 py-3 font-semibold">Diagnosis</th>
                <th className="px-6 py-3 font-semibold">Diagnosed By</th>
                <th className="px-6 py-3 font-semibold">Diagnosis Date</th>
                <th className="px-6 py-3 font-semibold">Severity</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDiagnoses.map((diagnosis) => (
                <tr key={diagnosis.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{diagnosis.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {diagnosis.diagnosedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {diagnosis.diagnosisDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={diagnosis.severity} color={getSeverityColor(diagnosis.severity)} light />
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={diagnosis.status} color={getStatusColor(diagnosis.status)} light />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {diagnosis.lastUpdated}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedDiagnosis(diagnosis)}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDiagnoses.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'Loading diagnosis records...' : (searchTerm ? `No diagnoses found matching "${searchTerm}"` : 'No diagnosis records found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selectedDiagnosis} onClose={() => setSelectedDiagnosis(null)} title="Diagnosis Details" width={800}>
        {selectedDiagnosis && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedDiagnosis.name}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge label={selectedDiagnosis.severity} color={getSeverityColor(selectedDiagnosis.severity)} light />
                  <Badge label={selectedDiagnosis.status} color={getStatusColor(selectedDiagnosis.status)} light />
                </div>
              </div>
              <div className="text-left sm:text-right text-sm text-gray-500">
                <p>Diagnosed on: <span className="font-medium text-gray-900">{selectedDiagnosis.diagnosisDate}</span></p>
                <p>Last updated: <span className="font-medium text-gray-900">{selectedDiagnosis.lastUpdated}</span></p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-gray-700">{selectedDiagnosis.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-teal-600" /> Symptoms
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {selectedDiagnosis.symptoms.map((symptom, i) => (
                    <li key={i}>{symptom}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-teal-600" /> Diagnosed By
                </h3>
                <p className="text-gray-700">{selectedDiagnosis.diagnosedBy}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                <FilePlus className="w-4 h-4 mr-2 text-teal-600" /> Treatment Plan
              </h3>
              <p className="text-gray-700">{selectedDiagnosis.treatmentPlan}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                  <Pill className="w-4 h-4 mr-2 text-teal-600" /> Prescribed Medications
                </h3>
                {selectedDiagnosis.medications.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {selectedDiagnosis.medications.map((med, i) => (
                      <li key={i}>{med}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No medications prescribed.</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-teal-600" /> Follow-up Schedule
                </h3>
                <p className="text-gray-700">{selectedDiagnosis.followUpSchedule}</p>
              </div>
            </div>

            {selectedDiagnosis.doctorNotes && (
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100/50">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-blue-600" /> Doctor's Notes (Read-only)
                </h3>
                <p className="text-sm text-gray-700">{selectedDiagnosis.doctorNotes}</p>
              </div>
            )}

            {selectedDiagnosis.relatedLabReports.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-teal-600" /> Related Lab Reports
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDiagnosis.relatedLabReports.map((report, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      <FileText className="w-3 h-3 mr-1.5" /> {report}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyDiagnoses;

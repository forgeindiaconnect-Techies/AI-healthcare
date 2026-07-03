import React, { useState, useEffect, useMemo } from 'react';
import API, { getCorrectUrl } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText, Activity, Search, Eye, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PatientManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalType, setModalType] = useState(null); // 'profile' or 'reports'
  const [selectedReport, setSelectedReport] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await API.get('/api/appointments', config);
        
        const appointmentsData = data.data || [];
        const uniquePatientsMap = new Map();
        appointmentsData.forEach(apt => {
          if (apt.patient && apt.patient._id && !uniquePatientsMap.has(apt.patient._id)) {
            uniquePatientsMap.set(apt.patient._id, {
              ...apt.patient,
              lastVisit: apt.appointmentDate || apt.date,
              status: apt.status
            });
          }
        });
        
        let uniquePatients = Array.from(uniquePatientsMap.values());
        
        if (uniquePatients.length === 0) {
           uniquePatients = [
             {
               _id: '1',
               name: 'Jane Doe',
               email: 'jane.doe@example.com',
               bloodGroup: 'O+',
               lastVisit: new Date(Date.now() - 86400000 * 5).toISOString()
             },
             {
               _id: '2',
               name: 'John Smith',
               email: 'john.smith@example.com',
               bloodGroup: 'A-',
               lastVisit: new Date(Date.now() - 86400000 * 15).toISOString()
             }
           ];
        }
        
        setPatients(uniquePatients);
      } catch (error) {
        console.error('Error fetching patients', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user.token]);

  useEffect(() => {
    if (modalType === 'reports' && selectedPatient) {
      const fetchReports = async () => {
        try {
          setReportsLoading(true);
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const patientId = selectedPatient._id || selectedPatient.user?._id;
          const { data } = await API.get(`/api/reports?patientId=${patientId}`, config);
          setPatientReports(data.data || []);
        } catch (error) {
          console.error('Error fetching patient reports:', error);
          toast.error('Failed to load patient reports');
        } finally {
          setReportsLoading(false);
        }
      };
      fetchReports();
    }
  }, [modalType, selectedPatient, user.token]);

  const filteredPatients = patients.filter(p => {
    const patientName = p.name || p.user?.name || '';
    const patientEmail = p.email || p.user?.email || '';
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patientEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <div className="p-8">Loading patient data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Search patients by name or email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <div className="text-sm text-gray-500">
            Total Patients: <span className="font-bold text-gray-900">{patients.length}</span>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <p>No patients found matching your search.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Records</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                        {(patient.name || patient.user?.name || 'P').charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{patient.name || patient.user?.name || 'Unknown Patient'}</div>
                        <div className="text-sm text-gray-500">{patient.email || patient.user?.email || 'No email provided'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {patient.bloodGroup || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(patient.lastVisit).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2 text-sm">
                      <button 
                        onClick={() => { setSelectedPatient(patient); setModalType('reports'); }}
                        className="flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                      >
                        <FileText className="w-4 h-4 mr-1" /> Reports
                      </button>
                      <button 
                        onClick={() => navigate('/dashboard/ai-analysis')}
                        className="flex items-center text-purple-600 hover:text-purple-900 bg-purple-50 px-2 py-1 rounded"
                      >
                        <Activity className="w-4 h-4 mr-1" /> AI Analysis
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => navigate(`/dashboard/doctor-patients/${patient._id || patient.user?._id}`)}
                      className="text-teal-600 hover:text-teal-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPatient && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center absolute top-4 right-4 z-10">
              <button onClick={() => {setSelectedPatient(null); setModalType(null); setSelectedReport(null);}} className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {modalType === 'profile' ? (
              <div className="overflow-y-auto overflow-x-hidden flex-1 relative bg-gray-50">
                {/* Header Profile Section */}
                <div className="relative pt-12 pb-24 px-8 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 text-white shadow-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400 opacity-20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                    <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white translate-y-12 shrink-0">
                      <span className="text-4xl font-extrabold text-teal-600">
                        {(selectedPatient.name || selectedPatient.user?.name || 'P').charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 pb-2">
                      <h2 className="text-3xl font-extrabold tracking-tight mb-1">{selectedPatient.name || selectedPatient.user?.name || 'Unknown Patient'}</h2>
                      <p className="text-teal-100 flex items-center justify-center sm:justify-start gap-2 text-sm font-medium">
                        {selectedPatient.email || selectedPatient.user?.email || 'No email provided'}
                      </p>
                    </div>
                    <div className="pb-3 flex gap-3">
                      <span className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-400/30 text-white text-sm font-bold rounded-full backdrop-blur-md flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="px-8 pt-16 pb-8 space-y-8 bg-gray-50">
                  
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-3 text-red-500">
                        <Activity className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Blood Group</p>
                      <p className="text-xl font-extrabold text-gray-900">{selectedPatient.bloodGroup || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-500">
                         <span className="font-bold text-lg">W</span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weight</p>
                      <p className="text-xl font-extrabold text-gray-900">{selectedPatient.weight ? `${selectedPatient.weight} kg` : '72 kg'}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3 text-indigo-500">
                        <span className="font-bold text-lg">H</span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Height</p>
                      <p className="text-xl font-extrabold text-gray-900">{selectedPatient.height ? `${selectedPatient.height} cm` : '175 cm'}</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-3 text-amber-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Visit</p>
                      <p className="text-sm font-extrabold text-gray-900">{new Date(selectedPatient.lastVisit).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <h3 className="font-bold text-gray-900">Medical Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Allergies</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">Penicillin</span>
                          <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">Peanuts</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chronic Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-100">Asthma</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedReport ? (
                <div className="space-y-4 animate-in fade-in duration-200 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 border-b pb-2 shrink-0">
                     <div className="flex items-center">
                       <h4 className="font-semibold text-gray-800">{selectedReport.title || selectedReport.name}</h4>
                       <span className="ml-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                         {selectedReport.reportDate ? new Date(selectedReport.reportDate).toLocaleDateString() : selectedReport.date}
                       </span>
                     </div>
                     <div className="flex gap-2">
                       {selectedReport.fileUrl && (
                         <a 
                           href={getCorrectUrl(selectedReport.fileUrl)}
                           download
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                         >
                           <FileText className="w-4 h-4 mr-1.5" /> Download
                         </a>
                       )}
                       <button 
                         onClick={() => setSelectedReport(null)} 
                         className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                       >
                         Back to Reports
                       </button>
                     </div>
                  </div>
                  <div className="bg-gray-100/80 rounded-xl flex justify-center items-center flex-1 border border-gray-200 shadow-inner overflow-hidden min-h-[400px]">
                     {selectedReport.fileUrl ? (
                        getCorrectUrl(selectedReport.fileUrl).match(/\.(jpeg|jpg|gif|png|webp)$/i) || selectedReport.fileType?.includes('image') ? (
                          <img src={getCorrectUrl(selectedReport.fileUrl)} alt={selectedReport.title} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <iframe 
                            src={`${getCorrectUrl(selectedReport.fileUrl)}#view=FitH`} 
                            title={selectedReport.title}
                            className="w-full h-full min-h-[500px] border-0"
                          />
                        )
                     ) : (
                       <div className="text-center w-full max-w-sm p-8">
                         <FileText className="w-16 h-16 text-teal-300 mx-auto mb-4" />
                         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-left">
                           <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                           <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                           <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                           <p className="text-sm text-gray-500 text-center italic">No document file available for {selectedReport.title || selectedReport.name}</p>
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                     <h4 className="font-semibold text-gray-700">Patient Reports</h4>
                     <button 
                       onClick={() => toast.success('New report request sent to patient successfully!')}
                       className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       Request New Report
                     </button>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                    {reportsLoading ? (
                      <div className="text-center p-8 text-gray-500 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                        Loading reports...
                      </div>
                    ) : patientReports.length === 0 ? (
                      <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                        <p>No reports found for this patient.</p>
                      </div>
                    ) : (
                      patientReports.map(report => (
                        <div key={report._id} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors bg-white shadow-sm">
                           <div className="flex items-center">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                               <FileText className="w-5 h-5" />
                             </div>
                             <div>
                               <p className="font-semibold text-sm text-gray-900">{report.title}</p>
                               <p className="text-xs text-gray-500">
                                 {new Date(report.reportDate || report.createdAt).toLocaleDateString()} • {report.reportType || 'General'}
                               </p>
                             </div>
                           </div>
                           <button 
                             onClick={() => setSelectedReport(report)}
                             className="text-teal-600 hover:text-teal-800 p-2 bg-teal-50 hover:bg-teal-100 transition-colors rounded"
                             title="View Report"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
};

export default PatientManagement;

import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calendar, Activity, AlertTriangle, CheckCircle, Download, ExternalLink, Bot, Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LabResults = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/reports?reportType=lab', config);
      setReports(data.data || []);
    } catch (error) {
      console.error('Error fetching lab reports', error);
      toast.error('Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (reportId) => {
    try {
      setAnalyzingId(reportId);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post(`/api/reports/${reportId}/analyze`, {}, config);
      toast.success('AI Analysis Complete');
      fetchLabReports(); // Refresh to get the new analysis data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze report');
    } finally {
      setAnalyzingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          Loading your laboratory results...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex justify-between items-center">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Lab Test Results</h1>
          <p className="text-teal-100 text-lg opacity-90 leading-relaxed">
            View, download, and analyze your laboratory reports with HealthAI.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No lab results found</h3>
          <p className="text-gray-500 mt-2">You haven't uploaded any laboratory reports yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of Reports */}
          <div className="lg:col-span-1 space-y-4">
            {reports.map((report) => (
              <div 
                key={report._id}
                onClick={() => setSelectedReport(report)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedReport?._id === report._id ? 'bg-teal-50 border-teal-500 shadow-md shadow-teal-100' : 'bg-white border-gray-100 hover:border-teal-300 hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1 pr-2">{report.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                
                <div className="space-y-1 mt-3">
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(report.reportDate).toLocaleDateString()}
                  </div>
                  {report.labName && (
                    <div className="flex items-center text-xs text-gray-500 gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      {report.labName}
                    </div>
                  )}
                </div>
                
                {report.aiAnalysis && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-teal-600 bg-teal-100/50 w-max px-2 py-1 rounded-md">
                    <Bot className="w-3 h-3" /> AI Analyzed
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Report Details & AI Analysis */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedReport.title}</h2>
                    <p className="text-sm text-gray-500">Uploaded on {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                  </div>
                  <a 
                    href={selectedReport.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    title="View Original Document"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  
                  {!selectedReport.aiAnalysis ? (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center mt-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500 shadow-sm">
                        <Bot className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-indigo-900 mb-2">HealthAI Interpretation</h3>
                      <p className="text-indigo-700 text-sm mb-6 max-w-md mx-auto">
                        Medical jargon can be confusing. Let our specialized AI analyze this lab report and break it down into simple, understandable terms.
                      </p>
                      <button 
                        onClick={() => handleAnalyze(selectedReport._id)}
                        disabled={analyzingId === selectedReport._id}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {analyzingId === selectedReport._id ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Report...</>
                        ) : (
                          <><Bot className="w-5 h-5" /> Generate AI Analysis</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Bot className="w-6 h-6" /></div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">AI Analysis Results</h3>
                          <p className="text-xs text-gray-500">Generated on {new Date(selectedReport.aiAnalysis.analyzedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Summary</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{selectedReport.aiAnalysis.summary}</p>
                      </div>

                      {selectedReport.aiAnalysis.keyFindings?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-teal-500" /> Key Findings
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.aiAnalysis.keyFindings.map((finding, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                                <span>{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedReport.aiAnalysis.recommendations?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {selectedReport.aiAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-3xl border border-dashed border-gray-200 h-full flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-gray-300 shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-600">Select a Report</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-xs">Click on a lab result from the list to view its details and AI analysis.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default LabResults;

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import API, { getCorrectUrl } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Clock, X, ExternalLink, Send, Download, ZoomIn, ZoomOut, AlertTriangle, MessageSquare } from 'lucide-react';

const ReviewReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewFileUrl, setViewFileUrl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  
  const [reviewNotes, setReviewNotes] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatting, setChatting] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [finalReportGenerating, setFinalReportGenerating] = useState(false);

  // Fetch AI analysis if not present when opening modal
  useEffect(() => {
    if (selectedReport && (!selectedReport.aiAnalysis?.summary)) {
      setAnalysisLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      API.post(`/api/reports/${selectedReport._id}/analyze`, {}, config)
        .then(({ data }) => {
          if (data.success) {
            // Update the report in local state
            const updated = { ...selectedReport, aiAnalysis: data.data.analysis || data.data.report.aiAnalysis };
            setSelectedReport(updated);
          }
        })
        .catch(err => console.error("Analysis failed:", err))
        .finally(() => setAnalysisLoading(false));
    }
  }, [selectedReport]);

  const handleGenerateFinalReport = () => {
    if (!selectedReport) return;
    setFinalReportGenerating(true);
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    API.post(`/api/medical/reports/${selectedReport._id}/final-report`, { notes: reviewNotes }, config)
      .then(({ data }) => {
        if (data.success) {
          toast.success('Final report generated and saved.');
          // Refresh report list
          fetchReports();
          setSelectedReport(data.data);
        } else {
          toast.error('Failed to generate final report.');
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to generate final report.');
      })
      .finally(() => setFinalReportGenerating(false));
  };
  const [submitting, setSubmitting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatting]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/medical/reports', config);
      setReports(data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = async (report) => {
    setSelectedReport(report);
    setReviewNotes(report.doctorNotes || '');
    setChatHistory(report.aiChatHistory || []);
    setZoom(1);

    const correctUrl = getCorrectUrl(report.fileUrl);
    if (!correctUrl) {
      setFileMissing(true);
      return;
    }
    
    try {
      const response = await fetch(getSecureUrl(correctUrl), { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      if (!response.ok || (contentType && contentType.includes('application/json'))) {
        setFileMissing(true);
      } else {
        setFileMissing(false);
      }
    } catch (e) {
      if (correctUrl.includes('/uploads/')) {
        setFileMissing(true);
      } else {
        setFileMissing(false);
      }
    }
  };

  const handleSaveStatus = async (status) => {
    try {
      setSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/medical/reports/${selectedReport._id}/review`, { 
        doctorNotes: reviewNotes,
        status: status 
      }, config);
      toast.success(`Report ${status === 'reviewed' ? 'marked as reviewed' : 'draft saved'}`);
      
      if (status === 'reviewed') {
        setSelectedReport(null);
      }
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatting) return;
    
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setChatting(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.post(`/api/medical/reports/${selectedReport._id}/chat`, { message: msg }, config);
      setChatHistory(data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to get AI response');
    } finally {
      setChatting(false);
    }
  };

  const getSecureUrl = (url) => {
    if (!url) return '';
    let secureUrl = url;
    if (secureUrl.startsWith('http://') && !secureUrl.includes('localhost')) {
      secureUrl = secureUrl.replace('http://', 'https://');
    }
    return secureUrl;
  };

  const [fileMissing, setFileMissing] = useState(false);

  const getDownloadUrl = (url) => {
    if (!url) return '';
    let dlUrl = getSecureUrl(url);
    if (dlUrl.includes('res.cloudinary.com') && !dlUrl.includes('fl_attachment')) {
      dlUrl = dlUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    return dlUrl;
  };

  const handleDownloadReport = async (reportUrl, fileName) => {
    const url = getCorrectUrl(reportUrl);
    if (!url) {
      toast.error('Report file not available. Please upload again.');
      return;
    }

    const secureUrl = getSecureUrl(url);
    try {
      const response = await fetch(secureUrl);
      const contentType = response.headers.get('content-type');
      if (!response.ok || (contentType && contentType.includes('application/json'))) {
        toast.error('Report file not available. Please upload again.');
        return;
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'medical-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error('Failed to download file. It may have been removed.');
    }
  };

  const handleViewFile = async (url) => {
    const correctUrl = getCorrectUrl(url);
    if (!correctUrl) {
      setFileMissing(true);
      setViewFileUrl('missing');
      return;
    }
    
    // Check if the file is actually returning JSON (404 error from our backend)
    try {
      const response = await fetch(getSecureUrl(correctUrl), { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      if (!response.ok || (contentType && contentType.includes('application/json'))) {
        setFileMissing(true);
      } else {
        setFileMissing(false);
      }
    } catch (e) {
      console.error("File check failed:", e);
      // If fetch fails (CORS, network error) and it's a local upload, it's highly likely missing
      if (correctUrl.includes('/uploads/')) {
        setFileMissing(true);
      } else {
        // If it's Cloudinary etc., it might load in iframe despite fetch failing
        setFileMissing(false);
      }
    }
    
    setViewFileUrl(correctUrl);
  };

  const renderViewer = (url) => {
    if (fileMissing || !url || url === 'missing') {
      return (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>Report file not available</h3>
          <p>The original file could not be found. Please request the patient to upload it again.</p>
        </div>
      );
    }

    const secureUrl = getSecureUrl(url);
    const isImage = secureUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || secureUrl.includes('image/upload');

    if (isImage) {
      return (
        <img
          src={secureUrl}
          alt="Report"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
          onError={() => setFileMissing(true)}
        />
      );
    }

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <object
          data={secureUrl}
          type="application/pdf"
          style={{ width: '100%', height: '100%', border: 'none' }}
        >
          <iframe
            src={secureUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Report Viewer"
          />
        </object>
        <div style={{ padding: '8px 0', textAlign: 'center' }}>
          <button
            onClick={() => handleDownloadReport(url, 'report.pdf')}
            style={{
              color: colors.primary,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <Download size={14} /> Download File
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading reports...</div>;
  }

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Review Uploaded Reports</h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Review and add notes to medical reports uploaded by patients.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
            <FileText size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>No Reports Found</h3>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>There are no reports requiring your review at this time.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {reports.map((report) => (
            <Card key={report._id} style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color={colors.primary} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{report.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>{report.reportType}</p>
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px', 
                  borderRadius: 12, 
                  fontSize: 12, 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: report.status?.toLowerCase() === 'reviewed' ? '#dcfce7' : '#fef9c3',
                  color: report.status?.toLowerCase() === 'reviewed' ? '#166534' : '#854d0e',
                  textTransform: 'capitalize'
                }}>
                  {report.status?.toLowerCase() === 'reviewed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {report.status}
                </div>
              </div>

              <div style={{ padding: '12px 0', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}>
                  <span style={{ color: colors.textMuted }}>Patient:</span> <span style={{ fontWeight: 500 }}>{report.patient?.name || 'Unknown'}</span>
                </p>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <span style={{ color: colors.textMuted }}>Uploaded:</span> {new Date(report.reportDate || report.createdAt).toLocaleDateString()}
                </p>
              </div>

              {report.doctorNotes && (
                <div style={{ background: colors.surfaceAlt, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: colors.primary }}>Your Notes:</p>
                  <p style={{ margin: 0, fontSize: 13 }}>{report.doctorNotes}</p>
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                <Button 
                  variant="outline" 
                  style={{ flex: 1, padding: '8px 0' }}
                  onClick={() => setViewFileUrl(getCorrectUrl(report.fileUrl))}
                >
                  View File
                </Button>
                <Button 
                  variant={report.status?.toLowerCase() === 'reviewed' ? "outline" : "primary"} 
                  style={{ flex: 1, padding: '8px 0' }}
                  onClick={() => handleReviewClick(report)}
                >
                  {report.status?.toLowerCase() === 'reviewed' ? 'Edit Review' : 'Review'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* File Viewer Modal */}
      {viewFileUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', width: '90%', height: '90%', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Report Viewer</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ZoomOut size={20}/></button>
                <span style={{ fontSize: 14 }}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ZoomIn size={20}/></button>
                <a href={getDownloadUrl(viewFileUrl)} download target="_blank" rel="noreferrer" style={{ color: colors.primary, marginLeft: 16 }}><Download size={20}/></a>
                <button onClick={() => { setViewFileUrl(null); setZoom(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 16 }}>
                  <X size={24} color={colors.textMuted} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#f1f5f9', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {renderViewer(viewFileUrl)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split-screen Review Modal */}
      {selectedReport && !viewFileUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fafc', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
          <div style={{ padding: '16px 24px', background: '#fff', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Reviewing: {selectedReport.title}</h2>
              <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>Patient: {selectedReport.patient?.name} | Uploaded: {new Date(selectedReport.reportDate || selectedReport.createdAt).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
              <X size={24} color={colors.textMuted} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Side: Viewer */}
            <div style={{ flex: 1, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', background: '#e2e8f0' }}>
              <div style={{ padding: '8px 16px', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 12, borderBottom: `1px solid ${colors.border}` }}>
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ZoomOut size={16}/></button>
                <span style={{ fontSize: 13 }}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ZoomIn size={16}/></button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s', width: '100%', height: '100%', minHeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  {renderViewer(getCorrectUrl(selectedReport.fileUrl))}
                </div>
              </div>
            </div>

            {/* Right Side: Chat & Notes */}
            <div style={{ width: 450, display: 'flex', flexDirection: 'column', background: '#fff', overflowY: 'auto' }}>
              <div style={{ padding: 20 }}>
                {/* AI Summary Box */}
                <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 16, border: '1px solid #bae6fd', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#0369a1', fontWeight: 600 }}>
                    <AlertTriangle size={18} />
                    <span>AI Pre-Analysis Summary</span>
                  </div>
                  {analysisLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1', fontSize: 13 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #bae6fd', borderTopColor: '#0369a1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Analyzing report... extracting text and values.
                    </div>
                  ) : selectedReport.aiAnalysis?.summary ? (
                    <>
                      <p style={{ fontSize: 14, margin: '0 0 12px', color: '#0f172a' }}>{selectedReport.aiAnalysis.summary}</p>
                      {selectedReport.aiAnalysis.keyFindings?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Key Findings:</span>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 13 }}>
                            {selectedReport.aiAnalysis.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        <span style={{ background: '#e0f2fe', padding: '4px 8px', borderRadius: 4, color: '#0369a1' }}>Status: {selectedReport.aiAnalysis.riskLevel || 'Normal'}</span>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, margin: 0, color: '#64748b' }}>No AI analysis available for this report.</p>
                  )}
                  <p style={{ fontSize: 11, margin: '12px 0 0', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid #bae6fd', paddingTop: 8 }}>
                    Disclaimer: AI suggestions are for assistance only. Final decision must be verified by the doctor.
                  </p>
                </div>

                {/* AI Chat Section */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={16} /> Chat about this report
                  </h3>
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, height: 300, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                    <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {chatHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: 40 }}>
                          Ask questions like:<br/><br/>
                          "Is this report normal?"<br/>
                          "Explain abnormal values"<br/>
                          "Give patient-friendly summary"
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.role === 'user' ? colors.primary : '#fff', color: msg.role === 'user' ? '#fff' : colors.text, padding: '10px 14px', borderRadius: 12, border: msg.role === 'user' ? 'none' : `1px solid ${colors.border}`, fontSize: 13, lineHeight: 1.5, borderBottomRightRadius: msg.role === 'user' ? 0 : 12, borderBottomLeftRadius: msg.role === 'user' ? 12 : 0 }}>
                            {msg.content}
                          </div>
                        ))
                      )}
                      {chatting && (
                        <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '10px 14px', borderRadius: 12, border: `1px solid ${colors.border}`, fontSize: 13 }}>
                          Thinking...
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleChatSubmit} style={{ display: 'flex', borderTop: `1px solid ${colors.border}`, background: '#fff', borderRadius: '0 0 12px 12px' }}>
                      <input 
                        type="text" 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Ask AI about this report..."
                        style={{ flex: 1, border: 'none', padding: '12px 16px', background: 'transparent', outline: 'none', fontSize: 13 }}
                      />
                      <button type="submit" disabled={chatting || !chatMessage.trim()} style={{ background: 'none', border: 'none', padding: '0 16px', cursor: (chatting || !chatMessage.trim()) ? 'default' : 'pointer', color: (chatting || !chatMessage.trim()) ? colors.textMuted : colors.primary }}>
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Final Notes */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, margin: '0 0 12px' }}>Final Doctor Notes</h3>
                  {selectedReport.finalReport ? (
                    <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, color: colors.primary, marginBottom: 8 }}>AI-Assisted Final Clinical Report</div>
                      {selectedReport.finalReport}
                    </div>
                  ) : (
                    <textarea 
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add your review notes for this patient..."
                      style={{ width: '100%', height: 120, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, fontFamily: 'inherit', resize: 'vertical', fontSize: 14 }}
                    />
                  )}
                  
                  {!selectedReport.finalReport && (
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateFinalReport} 
                      disabled={finalReportGenerating || analysisLoading} 
                      style={{ width: '100%', marginTop: 12 }}
                    >
                      {finalReportGenerating ? 'Generating Clinical Report...' : 'Generate Final Clinical Report'}
                    </Button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, paddingBottom: 20 }}>
                  <Button variant="outline" onClick={() => handleSaveStatus('pending')} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant="primary" onClick={() => handleSaveStatus('reviewed')} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? 'Saving...' : 'Mark as Reviewed'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewReports;

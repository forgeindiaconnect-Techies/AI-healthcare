import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Clock, X, ExternalLink } from 'lucide-react';

const ReviewReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

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

  const handleReview = async () => {
    if (!reviewNotes.trim()) {
      toast.error('Please enter review notes');
      return;
    }
    try {
      setSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/medical/reports/${selectedReport._id}/review`, { doctorNotes: reviewNotes }, config);
      toast.success('Report marked as reviewed');
      setSelectedReport(null);
      setReviewNotes('');
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
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
                    <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>{report.type}</p>
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
                  background: report.status === 'Reviewed' ? '#dcfce7' : '#fef9c3',
                  color: report.status === 'Reviewed' ? '#166534' : '#854d0e'
                }}>
                  {report.status === 'Reviewed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {report.status}
                </div>
              </div>

              <div style={{ padding: '12px 0', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}>
                  <span style={{ color: colors.textMuted }}>Patient:</span> <span style={{ fontWeight: 500 }}>{report.patient?.user?.name || 'Unknown'}</span>
                </p>
                <p style={{ margin: 0, fontSize: 14 }}>
                  <span style={{ color: colors.textMuted }}>Uploaded:</span> {new Date(report.uploadDate).toLocaleDateString()}
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
                  onClick={() => window.open(report.fileUrl, '_blank')}
                >
                  <ExternalLink size={16} style={{ marginRight: 8 }} />
                  View File
                </Button>
                {report.status !== 'Reviewed' && (
                  <Button 
                    variant="primary" 
                    style={{ flex: 1, padding: '8px 0' }}
                    onClick={() => {
                      setSelectedReport(report);
                      setReviewNotes('');
                    }}
                  >
                    Review
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '100%', maxWidth: 500, padding: 24, margin: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Review Report</h2>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color={colors.textMuted} />
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: colors.textMuted }}>Report Title</p>
              <p style={{ margin: 0, fontWeight: 500 }}>{selectedReport.title}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Clinical Notes / Observations</label>
              <textarea 
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter your professional assessment of this report..."
                style={{ width: '100%', height: 120, padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleReview} disabled={submitting}>
                {submitting ? 'Saving...' : 'Mark as Reviewed'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReviewReports;

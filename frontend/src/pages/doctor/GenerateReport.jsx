import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FileDown, Users, Activity, FileText, FilePlus, Calendar, Stethoscope } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const GenerateReport = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const reportRef = useRef(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      
      const aptRes = await API.get('/api/appointments', config);
      const appointmentsData = aptRes.data.data || [];
      const uniquePatientsMap = new Map();
      appointmentsData.forEach(apt => {
        if (apt.patient && apt.patient._id && !uniquePatientsMap.has(apt.patient._id)) {
          uniquePatientsMap.set(apt.patient._id, apt.patient);
        }
      });
      setPatients(Array.from(uniquePatientsMap.values()));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }

    try {
      setLoadingReport(true);
      setReportData(null);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const { data } = await API.get(`/api/medical/report/${selectedPatientId}`, config);
      
      setReportData(data.data);
      toast.success('Report data loaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to load report data');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setGeneratingPDF(true);
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Medical_Report_${reportData?.patient?.user?.name || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Generate Medical Report (PDF)</h1>
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Select a patient to compile and download their comprehensive medical history.</p>
      </div>

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Patient</label>
            <select 
              value={selectedPatientId} 
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface }}
            >
              <option value="">Choose a patient...</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.user?.name || p.name} ({p.user?.email || p.email})</option>
              ))}
            </select>
          </div>
          <Button 
            variant="primary" 
            onClick={handleGeneratePreview}
            disabled={loadingReport || !selectedPatientId}
            style={{ padding: '10px 24px' }}
          >
            {loadingReport ? 'Loading...' : 'Generate Preview'}
          </Button>
        </div>
      </Card>

      {reportData && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Report Preview</h2>
            <Button 
              variant="primary" 
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FileDown size={18} /> {generatingPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </div>

          {/* This is the printable area */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', overflow: 'auto' }}>
            <div 
              ref={reportRef} 
              style={{ 
                background: 'white', 
                width: '210mm', 
                minHeight: '297mm', 
                padding: '20mm', 
                margin: '0 auto', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: '#1e293b'
              }}
            >
              {/* Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>HealthAI Clinic</h1>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>Comprehensive Medical Report</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Date: {new Date().toLocaleDateString()}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14 }}>Generated by: {user.name}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} /> Patient Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>Full Name</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{reportData.patient?.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>Date of Birth / Gender</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      {reportData.patient?.user?.dateOfBirth ? new Date(reportData.patient.user.dateOfBirth).toLocaleDateString() : 'N/A'} 
                      {' / '}{reportData.patient?.user?.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>Contact Email</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{reportData.patient?.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>Blood Group</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{reportData.patient?.bloodGroup || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Latest Notes */}
              {reportData.latestNote && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Stethoscope size={18} /> Latest Clinical Notes
                  </h3>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{reportData.latestNote.note}</p>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                      Date: {new Date(reportData.latestNote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Diagnoses */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} /> Recent Diagnoses
                </h3>
                {reportData.diagnoses && reportData.diagnoses.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {reportData.diagnoses.map(diag => (
                      <li key={diag._id} style={{ marginBottom: 12 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{diag.primaryDiagnosis} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b', marginLeft: 8 }}>({new Date(diag.createdAt).toLocaleDateString()})</span></p>
                        {diag.symptoms && diag.symptoms.length > 0 && (
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>Symptoms: {diag.symptoms.join(', ')}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic' }}>No diagnoses recorded.</p>
                )}
              </div>

              {/* Medications */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FilePlus size={18} /> Current Prescriptions
                </h3>
                {reportData.meds && reportData.meds.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Medication</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Dosage</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Frequency</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.meds.map(med => (
                        <tr key={med._id}>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{med.medicationName}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>{med.dosage}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>{med.frequency}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>{med.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic' }}>No active prescriptions.</p>
                )}
              </div>

              {/* Lab Recs */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} /> Lab Recommendations
                </h3>
                {reportData.labs && reportData.labs.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {reportData.labs.map(lab => (
                      <li key={lab._id} style={{ marginBottom: 8, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>{lab.testName}</span> - {lab.reason} 
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({lab.status})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic' }}>No lab recommendations.</p>
                )}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                <p style={{ margin: 0 }}>This is an automatically generated medical report from the HealthAI system.</p>
                <p style={{ margin: 0 }}>CONFIDENTIAL MEDICAL RECORD</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateReport;

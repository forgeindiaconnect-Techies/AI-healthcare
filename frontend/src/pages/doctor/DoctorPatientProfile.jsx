import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Card, Button, Badge, Avatar, Input } from '../../components/ui/SharedUI';
import API, { getCorrectUrl } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  ArrowLeft, Activity, Heart, Thermometer, Droplets, 
  Wind, ClipboardList, Stethoscope, Pill, CalendarClock, 
  Sun, FileText, Download, Save, Printer, TrendingUp, AlertTriangle, User, MessageSquare, Send, X, ZoomIn, ZoomOut, CheckCircle, Clock
} from 'lucide-react';

const DoctorPatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    patient: null, diagnoses: [], labRecommendations: [], followUps: [], prescriptions: [], notes: [], reports: []
  });
  
  const [activeTab, setActiveTab] = useState('summary');
  const printRef = useRef(null);

  // Forms State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const [vitalsForm, setVitalsForm] = useState({ bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '', respiratoryRate: '', glucoseLevel: '' });
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatting, setChatting] = useState(false);
  const chatEndRef = useRef(null);

  const [viewFileUrl, setViewFileUrl] = useState(null);
  const [zoom, setZoom] = useState(1);

  const [medForm, setMedForm] = useState({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });
  
  const [followUpForm, setFollowUpForm] = useState({ type: '', timeline: '' });

  const [lifestyleForm, setLifestyleForm] = useState({ diet: '', exercise: '', sleep: '', water: '', smokingAlcohol: '', notes: '' });

  const [noteForm, setNoteForm] = useState({ title: '', note: '' });
  
  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [data.patient?.aiDiagnosisChatHistory, chatting]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/medical/patients/${id}`, { headers: { Authorization: `Bearer ${user?.token}` } });
      setData(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleUpdateProfile = async () => {
    try {
      await API.put(`/api/medical/patients/${data.patient._id}`, profileForm, { headers: { Authorization: `Bearer ${user?.token}` } });
      toast.success('Profile updated');
      setEditProfileOpen(false);
      fetchData();
    } catch (err) { toast.error('Error updating profile'); }
  };

  const handleAddVitals = async () => {
    try {
      const bpParts = vitalsForm.bloodPressure.split('/');
      const payload = {
        bloodPressure: bpParts.length === 2 ? { systolic: parseInt(bpParts[0]), diastolic: parseInt(bpParts[1]) } : undefined,
        heartRate: vitalsForm.heartRate,
        temperature: vitalsForm.temperature,
        oxygenSaturation: vitalsForm.oxygenSaturation,
        respiratoryRate: vitalsForm.respiratoryRate,
        glucoseLevel: vitalsForm.glucoseLevel
      };
      await API.post(`/api/medical/patients/${data.patient._id}/vitals`, payload, { headers: { Authorization: `Bearer ${user?.token}` } });
      toast.success('Vitals added');
      setVitalsForm({ bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '', respiratoryRate: '', glucoseLevel: '' });
      fetchData();
    } catch (err) { toast.error('Error adding vitals'); }
  };

  const handleAIChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatting(true);
    
    // Optimistic update
    const newPatient = {...data.patient};
    newPatient.aiDiagnosisChatHistory = [...(newPatient.aiDiagnosisChatHistory||[]), { role: 'user', content: msg }];
    setData(prev => ({...prev, patient: newPatient}));

    try {
      await API.post(`/api/medical/patients/${data.patient._id}/ai-chat`, { message: msg }, { headers: { Authorization: `Bearer ${user?.token}` } });
      fetchData();
    } catch (err) { toast.error('Failed to get AI response'); }
    finally { setChatting(false); }
  };

  const handleAddMedication = async () => {
    try {
      await API.post('/api/medical/prescriptions', { 
        patient: data.patient.user?._id, 
        medicines: [{
          name: medForm.medicineName,
          dosage: medForm.dosage,
          frequency: medForm.frequency,
          duration: medForm.duration,
          instructions: medForm.instructions
        }]
      }, { headers: { Authorization: `Bearer ${user?.token}` } });
      toast.success('Medication added');
      setMedForm({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });
      fetchData();
    } catch (err) { toast.error('Error adding medication'); }
  };

  const handleAddFollowUp = async () => {
    try {
      await API.post('/api/medical/followup', { 
        patient: data.patient._id, 
        type: followUpForm.type, 
        timeline: followUpForm.timeline 
      }, { headers: { Authorization: `Bearer ${user?.token}` } });
      toast.success('Follow up scheduled');
      setFollowUpForm({ type: '', timeline: '' });
      fetchData();
    } catch (err) { toast.error('Error scheduling follow up'); }
  };

  const handleSaveLifestyle = async () => {
    try {
      await API.put(`/api/medical/patients/${data.patient._id}/lifestyle`, lifestyleForm, { headers: { Authorization: `Bearer ${user?.token}` } });
      toast.success('Lifestyle plan saved');
      fetchData();
    } catch (err) { toast.error('Error saving lifestyle plan'); }
  };

  const handleAddNote = async () => {
    try {
      await API.post('/api/medical/notes', { 
        patient: data.patient._id, 
        note: `**${noteForm.title}**\n\n${noteForm.note}`
      }, { headers: { Authorization: `Bearer ${user?.token}` } });
      toast.success('Note saved');
      setNoteForm({ title: '', note: '' });
      fetchData();
    } catch (err) { toast.error('Error saving note'); }
  };

  const handleDownloadPDF = async () => {
    const input = printRef.current;
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.patient.user.name.replace(/\s+/g, '-').toLowerCase()}-medical-report.pdf`);
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  // --- Render Helpers ---
  const getSecureUrl = (url) => {
    if (!url) return '';
    let secureUrl = url;
    if (secureUrl.startsWith('http://') && !secureUrl.includes('localhost')) {
      secureUrl = secureUrl.replace('http://', 'https://');
    }
    return secureUrl;
  };
  const renderViewer = (url) => {
    if (!url) return null;
    const secureUrl = getSecureUrl(url);
    const isImage = secureUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || secureUrl.includes('image/upload');
    if (isImage) return <img src={secureUrl} alt="Report" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
    return <iframe src={secureUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Report Viewer" />;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Patient Medical Profile...</div>;
  if (!data?.patient) return <div style={{ padding: 40 }}>Patient not found.</div>;

  const { patient, diagnoses, labRecommendations, followUps, prescriptions, notes, reports } = data;
  const pUser = patient.user;
  const latestVitals = patient.vitals?.length > 0 ? patient.vitals[0] : null;

  const tabs = [
    { id: 'summary', label: 'Summary', icon: <User size={16} /> },
    { id: 'vitals', label: 'Vital Signs', icon: <Activity size={16} /> },
    { id: 'diagnosis', label: 'AI Diagnosis', icon: <Stethoscope size={16} /> },
    { id: 'labs', label: 'Lab Tests', icon: <Thermometer size={16} /> },
    { id: 'meds', label: 'Medications', icon: <Pill size={16} /> },
    { id: 'followup', label: 'Follow Up', icon: <CalendarClock size={16} /> },
    { id: 'lifestyle', label: 'Lifestyle', icon: <Sun size={16} /> },
    { id: 'notes', label: 'Doctor Notes', icon: <FileText size={16} /> },
  ];

  return (
    <div id="patient-report-container" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER - No Print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}><ArrowLeft size={20} /></button>
          <Avatar name={pUser?.name} size={64} bg={colors.primary} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: colors.text }}>{pUser?.name}</h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, color: colors.textMuted, fontSize: 13 }}>
              <span>Age: {patient.age || 'Not Added'}</span>
              <span>•</span>
              <span>Gender: {pUser?.gender || 'Not Added'}</span>
              <span>•</span>
              <span>Blood: <Badge label={patient.bloodType || 'Not Added'} color={colors.danger} light /></span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={() => window.print()} variant="ghost" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Printer size={16} /> Print</Button>
          <Button onClick={handleDownloadPDF} variant="primary" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Download size={16} /> PDF Report</Button>
        </div>
      </div>

      <div ref={printRef} style={{ background: '#fff' }}>
        {/* HEALTH SCORE BANNER */}
        <Card style={{ marginBottom: 24, background: `linear-gradient(135deg, ${colors.primary}15, ${colors.success}15)`, border: `1px solid ${colors.primary}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', border: `4px solid ${colors.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: colors.success }}>{patient.healthScore || 85}</div>
            <div>
              <h3 style={{ margin: 0, color: colors.text, fontSize: 16 }}>AI Health Score</h3>
              <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>Patient is in generally good health.</p>
            </div>
          </div>
          <div><Badge label="Risk: LOW" color={colors.success} /></div>
        </Card>

        {/* TABS - No Print */}
        <div className="no-print" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 8 }}>
          {tabs.map(t => (
            <button 
              key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ 
                padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeTab === t.id ? colors.primary : colors.surfaceAlt,
                color: activeTab === t.id ? '#fff' : colors.textMuted,
                display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap'
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="print-full-width" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* TAB CONTENT */}
            {(activeTab === 'summary' || true) && (
              <div style={{ display: activeTab === 'summary' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={18} color={colors.primary}/> Patient Summary</h3>
                    <Button className="no-print" variant="ghost" size="sm" onClick={() => {
                      setProfileForm({
                        age: patient.age || '', gender: pUser?.gender || '', bloodType: patient.bloodType || '',
                        height: patient.height || '', weight: patient.weight || '', allergies: patient.allergies?.join(', ') || '',
                        chronicConditions: patient.chronicConditions?.join(', ') || '', emergencyContact: patient.emergencyContact || { name: '', phone: '' }
                      });
                      setEditProfileOpen(true);
                    }}>Edit Profile</Button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Height</span><div style={{ fontWeight: 600 }}>{patient.height ? `${patient.height} cm` : 'Not Added'}</div></div>
                    <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Weight</span><div style={{ fontWeight: 600 }}>{patient.weight ? `${patient.weight} kg` : 'Not Added'}</div></div>
                    <div><span style={{ color: colors.textMuted, fontSize: 12 }}>BMI</span><div style={{ fontWeight: 600 }}>{patient.bmi || 'Not Added'}</div></div>
                    <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Allergies</span><div style={{ fontWeight: 600 }}>{patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'Not Added'}</div></div>
                    <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Existing Diseases</span><div style={{ fontWeight: 600 }}>{patient.chronicConditions?.length > 0 ? patient.chronicConditions.join(', ') : 'Not Added'}</div></div>
                    <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Emergency Contact</span><div style={{ fontWeight: 600 }}>{patient.emergencyContact?.name ? `${patient.emergencyContact.name} (${patient.emergencyContact.phone})` : 'Not Added'}</div></div>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'vitals' || true) && (
              <div style={{ display: activeTab === 'vitals' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={18} color={colors.danger}/> Vital Signs (Latest)</h3>
                  {latestVitals ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                       <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Heart size={20} color={colors.danger} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>{latestVitals.heartRate || '--'} <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>bpm</span></div><div style={{fontSize:11, color:colors.textMuted}}>Heart Rate</div></div>
                       <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Thermometer size={20} color={colors.warning} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>{latestVitals.temperature || '--'} <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>°F</span></div><div style={{fontSize:11, color:colors.textMuted}}>Temperature</div></div>
                       <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Droplets size={20} color={colors.primary} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>{latestVitals.bloodPressure?.systolic ? `${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic}` : '--'} <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>mmHg</span></div><div style={{fontSize:11, color:colors.textMuted}}>Blood Pressure</div></div>
                       <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Wind size={20} color={colors.info} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>{latestVitals.oxygenSaturation || '--'} <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>%</span></div><div style={{fontSize:11, color:colors.textMuted}}>Oxygen (SpO2)</div></div>
                       <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Activity size={20} color={colors.success} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>{latestVitals.respiratoryRate || '--'} <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>bpm</span></div><div style={{fontSize:11, color:colors.textMuted}}>Resp Rate</div></div>
                       <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Droplets size={20} color={colors.warning} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>{latestVitals.glucoseLevel || '--'} <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>mg/dL</span></div><div style={{fontSize:11, color:colors.textMuted}}>Blood Sugar</div></div>
                       <div style={{ gridColumn: '1 / -1', fontSize: 12, color: colors.textMuted, textAlign: 'right' }}>Last updated: {new Date(latestVitals.date).toLocaleString()}</div>
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, background: colors.surfaceAlt, borderRadius: 8, marginBottom: 24 }}>No vital signs added yet.</div>
                  )}

                  <div className="no-print" style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
                    <h4 style={{ margin: '0 0 12px' }}>Add / Update Vitals</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="Blood Pressure (SYS/DIA)" value={vitalsForm.bloodPressure} onChange={e=>setVitalsForm({...vitalsForm, bloodPressure: e.target.value})} placeholder="e.g. 120/80" />
                      <Input label="Heart Rate (bpm)" value={vitalsForm.heartRate} onChange={e=>setVitalsForm({...vitalsForm, heartRate: e.target.value})} placeholder="e.g. 72" />
                      <Input label="Temperature (°F)" value={vitalsForm.temperature} onChange={e=>setVitalsForm({...vitalsForm, temperature: e.target.value})} placeholder="e.g. 98.6" />
                      <Input label="SpO2 (%)" value={vitalsForm.oxygenSaturation} onChange={e=>setVitalsForm({...vitalsForm, oxygenSaturation: e.target.value})} placeholder="e.g. 98" />
                      <Input label="Respiratory Rate" value={vitalsForm.respiratoryRate} onChange={e=>setVitalsForm({...vitalsForm, respiratoryRate: e.target.value})} placeholder="e.g. 16" />
                      <Input label="Blood Sugar (mg/dL)" value={vitalsForm.glucoseLevel} onChange={e=>setVitalsForm({...vitalsForm, glucoseLevel: e.target.value})} placeholder="e.g. 95" />
                    </div>
                    <Button onClick={handleAddVitals} style={{ marginTop: 12 }}>Save Vitals</Button>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'diagnosis' || true) && (
              <div style={{ display: activeTab === 'diagnosis' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Stethoscope size={18} color={colors.primary}/> AI Diagnosis History</h3>
                  
                  {diagnoses.length > 0 ? (
                    <div style={{ marginBottom: 24 }}>
                      {diagnoses.map((diag, i) => (
                        <div key={i} style={{ padding: 16, background: colors.primary+'08', borderRadius: 8, marginBottom: 12, border: `1px solid ${colors.primary}20` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: colors.primary }}>{diag.primaryDiagnosis}</div>
                            <Badge label={`Risk: ${diag.riskLevel}`} color={diag.riskLevel === 'High' ? colors.danger : colors.warning} />
                          </div>
                          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>Confidence: {diag.confidence}% | Date: {new Date(diag.createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: 13, color: colors.textMuted }}>Possible Conditions: {diag.possibleConditions?.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, background: colors.surfaceAlt, borderRadius: 8, marginBottom: 24 }}>No AI diagnosis records found.</div>
                  )}

                  <div className="no-print" style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
                    <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={16}/> Ask AI About Patient</h4>
                    <div style={{ background: '#f8fafc', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, height: 300, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
                        {(patient.aiDiagnosisChatHistory || []).map((msg, i) => (
                          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.role === 'user' ? colors.primary : '#fff', color: msg.role === 'user' ? '#fff' : colors.text, padding: '10px 14px', borderRadius: 12, border: msg.role === 'user' ? 'none' : `1px solid ${colors.border}`, fontSize: 13 }}>
                            {msg.content}
                          </div>
                        ))}
                        {chatting && <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '10px 14px', borderRadius: 12, border: `1px solid ${colors.border}`, fontSize: 13 }}>Thinking...</div>}
                        <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={handleAIChat} style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ask about symptoms, risks..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, outline: 'none' }} />
                        <Button type="submit" disabled={chatting || !chatMessage.trim()}><Send size={16}/></Button>
                      </form>
                    </div>
                    <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' }}>Disclaimer: AI suggestions must be verified by a doctor.</p>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'labs' || true) && (
              <div style={{ display: activeTab === 'labs' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Thermometer size={18} color={colors.warning}/> Uploaded Lab Reports</h3>
                  {reports?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {reports.map((report) => (
                        <div key={report._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color={colors.primary} /></div>
                            <div>
                              <h4 style={{ margin: 0 }}>{report.title}</h4>
                              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{report.reportType} • Uploaded: {new Date(report.reportDate).toLocaleDateString()}</div>
                              {report.doctorNotes && <div style={{ fontSize: 12, marginTop: 8, color: colors.primary, background: colors.primary+'10', padding: '4px 8px', borderRadius: 4 }}>Note: {report.doctorNotes}</div>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Badge label={report.status} color={report.status?.toLowerCase() === 'reviewed' ? colors.success : colors.warning} />
                            <Button className="no-print" variant="outline" size="sm" onClick={() => setViewFileUrl(report.fileUrl)}>View File</Button>
                            <Button className="no-print" size="sm" onClick={() => navigate('/dashboard/review-reports')}>Review Module</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, background: colors.surfaceAlt, borderRadius: 8 }}>No lab reports uploaded yet.</div>
                  )}
                </Card>
              </div>
            )}

            {(activeTab === 'meds' || true) && (
              <div style={{ display: activeTab === 'meds' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Pill size={18} color={colors.success}/> Current Medications</h3>
                  {prescriptions?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                      {prescriptions.map((rx) => (
                        <div key={rx._id}>
                          {rx.medicines.map((med, i) => (
                            <div key={i} style={{ padding: 12, border: `1px solid ${colors.border}`, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>{med.name} <span style={{ color: colors.textMuted, fontWeight: 400 }}>- {med.dosage}</span></div>
                                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{med.frequency} • For {med.duration}</div>
                                {med.instructions && <div style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>{med.instructions}</div>}
                              </div>
                              <div style={{ fontSize: 11, color: colors.textMuted }}>Prescribed: {new Date(rx.createdAt).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, background: colors.surfaceAlt, borderRadius: 8, marginBottom: 24 }}>No medications prescribed yet.</div>
                  )}
                  
                  <div className="no-print" style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 12px' }}>Add Medication</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="Medicine Name" value={medForm.medicineName} onChange={e=>setMedForm({...medForm, medicineName: e.target.value})} placeholder="e.g. Metformin" />
                      <Input label="Dosage" value={medForm.dosage} onChange={e=>setMedForm({...medForm, dosage: e.target.value})} placeholder="e.g. 500 mg" />
                      <Input label="Frequency" value={medForm.frequency} onChange={e=>setMedForm({...medForm, frequency: e.target.value})} placeholder="e.g. Twice Daily" />
                      <Input label="Duration" value={medForm.duration} onChange={e=>setMedForm({...medForm, duration: e.target.value})} placeholder="e.g. 30 Days" />
                      <div style={{ gridColumn: '1 / -1' }}><Input label="Instructions" value={medForm.instructions} onChange={e=>setMedForm({...medForm, instructions: e.target.value})} placeholder="e.g. After Food" /></div>
                    </div>
                    <Button onClick={handleAddMedication} variant="secondary" style={{ marginTop: 12 }}>Save Medication</Button>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'followup' || true) && (
              <div style={{ display: activeTab === 'followup' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><CalendarClock size={18} color={colors.primary}/> Follow-Up Schedule</h3>
                  {followUps?.length > 0 ? (
                    <div style={{ marginBottom: 24 }}>
                      {followUps.map((fu, i) => (
                        <div key={i} style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{fu.type}</div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>Scheduled: {new Date(fu.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div style={{ color: colors.primary, fontWeight: 600 }}>Timeline: {fu.timeline}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, background: colors.surfaceAlt, borderRadius: 8, marginBottom: 24 }}>No follow-ups scheduled.</div>
                  )}

                  <div className="no-print" style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                    <h4 style={{ margin: '0 0 12px' }}>Schedule Follow Up</h4>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}><Input label="Reason / Type" value={followUpForm.type} onChange={e=>setFollowUpForm({...followUpForm, type: e.target.value})} placeholder="e.g. Review Blood Test" style={{marginBottom:0}}/></div>
                      <div style={{ flex: 1 }}><Input label="Timeline" value={followUpForm.timeline} onChange={e=>setFollowUpForm({...followUpForm, timeline: e.target.value})} placeholder="e.g. In 2 weeks" style={{marginBottom:0}}/></div>
                      <Button onClick={handleAddFollowUp} variant="secondary">Schedule</Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'lifestyle' || true) && (
              <div style={{ display: activeTab === 'lifestyle' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Sun size={18} color={colors.warning}/> Lifestyle & Habits Plan</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Diet Advice</div><div style={{ fontWeight: 600 }}>{patient.lifestyle?.diet || 'Not set'}</div></div>
                    <div style={{ padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Exercise</div><div style={{ fontWeight: 600 }}>{patient.lifestyle?.exercise || 'Not set'}</div></div>
                    <div style={{ padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Sleep</div><div style={{ fontWeight: 600 }}>{patient.lifestyle?.sleep || 'Not set'}</div></div>
                    <div style={{ padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Water Intake</div><div style={{ fontWeight: 600 }}>{patient.lifestyle?.water || 'Not set'}</div></div>
                    <div style={{ padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Smoking / Alcohol</div><div style={{ fontWeight: 600 }}>{patient.lifestyle?.smokingAlcohol || 'Not set'}</div></div>
                    <div style={{ padding: 16, border: `1px solid ${colors.border}`, borderRadius: 8 }}><div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Other Notes</div><div style={{ fontWeight: 600 }}>{patient.lifestyle?.notes || 'None'}</div></div>
                  </div>
                  
                  <div className="no-print" style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
                    <h4 style={{ margin: '0 0 12px' }}>Update Lifestyle Recommendations</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Input label="Diet Advice" value={lifestyleForm.diet} onChange={e=>setLifestyleForm({...lifestyleForm, diet: e.target.value})} placeholder="e.g. Low sodium" onFocus={() => !lifestyleForm.diet && setLifestyleForm(prev => ({...prev, ...patient.lifestyle}))} />
                      <Input label="Exercise" value={lifestyleForm.exercise} onChange={e=>setLifestyleForm({...lifestyleForm, exercise: e.target.value})} placeholder="e.g. 30 min walk daily" />
                      <Input label="Sleep" value={lifestyleForm.sleep} onChange={e=>setLifestyleForm({...lifestyleForm, sleep: e.target.value})} placeholder="e.g. 8 hours" />
                      <Input label="Water" value={lifestyleForm.water} onChange={e=>setLifestyleForm({...lifestyleForm, water: e.target.value})} placeholder="e.g. 3L daily" />
                      <Input label="Smoking/Alcohol" value={lifestyleForm.smokingAlcohol} onChange={e=>setLifestyleForm({...lifestyleForm, smokingAlcohol: e.target.value})} placeholder="e.g. Stop smoking" />
                      <Input label="Notes" value={lifestyleForm.notes} onChange={e=>setLifestyleForm({...lifestyleForm, notes: e.target.value})} placeholder="Optional notes" />
                    </div>
                    <Button onClick={handleSaveLifestyle} variant="secondary" style={{ marginTop: 12 }}>Save Plan</Button>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'notes' || true) && (
              <div style={{ display: activeTab === 'notes' ? 'block' : 'none' }} className="print-block">
                <Card>
                  <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={colors.primary}/> Doctor Notes</h3>
                  
                  {notes?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                      {notes.map((n, i) => (
                        <div key={i} style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8, borderLeft: `4px solid ${colors.primary}` }}>
                          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>{new Date(n.createdAt).toLocaleString()}</div>
                          <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{n.note}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: colors.textMuted, background: colors.surfaceAlt, borderRadius: 8, marginBottom: 24 }}>No doctor notes found.</div>
                  )}

                  <div className="no-print" style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
                    <h4 style={{ margin: '0 0 12px' }}>Add Note</h4>
                    <Input label="Note Title / Subject" value={noteForm.title} onChange={e=>setNoteForm({...noteForm, title: e.target.value})} placeholder="e.g. Initial Assessment" />
                    <textarea 
                      value={noteForm.note} onChange={(e) => setNoteForm({...noteForm, note: e.target.value})} 
                      placeholder="Type your detailed medical notes here..."
                      style={{ width: '100%', boxSizing: 'border-box', minHeight: 120, padding: 16, borderRadius: 8, border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', marginTop: 12, marginBottom: 12 }}
                    />
                    <Button onClick={handleAddNote} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16}/> Save Note</Button>
                  </div>
                </Card>
              </div>
            )}

          </div>
          
          {/* RIGHT SIDEBAR - No Print */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card>
              <h4 style={{ margin: '0 0 16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}>Recent Activity</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {latestVitals && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.info+'15', color: colors.info, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16}/></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Vitals Updated</div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>{new Date(latestVitals.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
                {prescriptions?.length > 0 && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.success+'15', color: colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pill size={16}/></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Prescription Added</div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>{new Date(prescriptions[0].createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
                {reports?.length > 0 && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.warning+'15', color: colors.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16}/></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Report Uploaded</div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>{new Date(reports[0].reportDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Edit Patient Profile</h3>
              <button onClick={() => setEditProfileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Age" type="number" value={profileForm.age} onChange={e=>setProfileForm({...profileForm, age: e.target.value})} />
              <Input label="Gender" value={profileForm.gender} onChange={e=>setProfileForm({...profileForm, gender: e.target.value})} placeholder="Male/Female" />
              <Input label="Blood Type" value={profileForm.bloodType} onChange={e=>setProfileForm({...profileForm, bloodType: e.target.value})} placeholder="e.g. O+" />
              <Input label="Height (cm)" type="number" value={profileForm.height} onChange={e=>setProfileForm({...profileForm, height: e.target.value})} />
              <Input label="Weight (kg)" type="number" value={profileForm.weight} onChange={e=>setProfileForm({...profileForm, weight: e.target.value})} />
              <Input label="Emergency Contact Name" value={profileForm.emergencyContact?.name || ''} onChange={e=>setProfileForm({...profileForm, emergencyContact: {...profileForm.emergencyContact, name: e.target.value}})} />
              <Input label="Emergency Contact Phone" value={profileForm.emergencyContact?.phone || ''} onChange={e=>setProfileForm({...profileForm, emergencyContact: {...profileForm.emergencyContact, phone: e.target.value}})} />
              <div style={{ gridColumn: '1 / -1' }}><Input label="Allergies (comma separated)" value={profileForm.allergies} onChange={e=>setProfileForm({...profileForm, allergies: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><Input label="Existing Diseases (comma separated)" value={profileForm.chronicConditions} onChange={e=>setProfileForm({...profileForm, chronicConditions: e.target.value})} /></div>
            </div>
            <Button onClick={handleUpdateProfile} style={{ width: '100%', marginTop: 20 }}>Save Changes</Button>
          </div>
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
                <button onClick={() => { setViewFileUrl(null); setZoom(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 16 }}><X size={24} color={colors.textMuted} /></button>
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
      
      {/* Dynamic style for printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full-width { grid-column: 1 / -1 !important; }
          .print-block { display: block !important; margin-bottom: 30px; page-break-inside: avoid; }
          body * { visibility: hidden; }
          #patient-report-container, #patient-report-container * { visibility: visible; }
          #patient-report-container { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default DoctorPatientProfile;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Card, Button, Badge, Avatar, Input } from '../../components/ui/SharedUI';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Activity, Heart, Thermometer, Droplets, 
  Wind, ClipboardList, Stethoscope, Pill, CalendarClock, 
  Sun, FileText, Download, Save, Printer, TrendingUp, AlertTriangle, User, RefreshCw
} from 'lucide-react';

const DoctorPatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  
  // State for forms
  const [activeTab, setActiveTab] = useState('summary');
  
  const [diagnosisForm, setDiagnosisForm] = useState({ primaryDiagnosis: '', confidence: 92, possibleConditions: '', riskLevel: 'Low' });
  const [labForm, setLabForm] = useState({ testName: '', reason: '', priority: 'Medium', estimatedCost: '', preparationInstructions: '' });
  const [prescriptForm, setPrescriptForm] = useState({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });
  const [followUpForm, setFollowUpForm] = useState({ type: '', timeline: '' });
  const [notes, setNotes] = useState('');
  
  const fetchData = async () => {
    try {
      const { data } = await API.get(`/api/medical/patients/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPatientData(data.data);
      if (data.data.notes && data.data.notes.length > 0) {
        setNotes(data.data.notes[0].note);
      }
    } catch (error) {
      console.error("Error fetching patient medical data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSaveDiagnosis = async () => {
    try {
      await API.post('/api/medical/diagnosis', { 
        patient: id, 
        ...diagnosisForm,
        possibleConditions: diagnosisForm.possibleConditions.split(',').map(s => s.trim())
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchData();
      alert('Diagnosis saved successfully!');
    } catch (err) { alert('Error saving diagnosis'); }
  };

  const handleSaveLab = async () => {
    try {
      await API.post('/api/medical/lab-recommendations', { patient: id, ...labForm }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchData();
      setLabForm({ testName: '', reason: '', priority: 'Medium', estimatedCost: '', preparationInstructions: '' });
    } catch (err) { alert('Error saving lab recommendation'); }
  };

  const handleSavePrescription = async () => {
    try {
      // Assuming a generic endpoint for adding a medicine item
      await API.post('/api/medical/prescriptions', { patient: id, medications: [prescriptForm] }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchData();
      setPrescriptForm({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });
    } catch (err) { alert('Error saving prescription'); }
  };

  const handleSaveFollowUp = async () => {
    try {
      await API.post('/api/medical/followup', { patient: id, ...followUpForm }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchData();
      setFollowUpForm({ type: '', timeline: '' });
    } catch (err) { alert('Error saving followup'); }
  };

  const handleSaveNotes = async () => {
    try {
      await API.post('/api/medical/notes', { patient: id, note: notes, healthScore: 85, lifestyleRecommendations: ["Walk 30 minutes daily", "Reduce sugar"] }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchData();
      alert('Notes and recommendations saved!');
    } catch (err) { alert('Error saving notes'); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Patient Medical Profile...</div>;
  if (!patientData?.patient) return <div style={{ padding: 40 }}>Patient not found.</div>;

  const { patient, diagnoses, labRecommendations, followUps, prescriptions } = patientData;
  const pUser = patient.user;

  // Tabs layout
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
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: colors.textMuted }}><ArrowLeft size={20} /></button>
          <Avatar name={pUser?.name} size={64} bg={colors.primary} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: colors.text }}>{pUser?.name}</h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, color: colors.textMuted, fontSize: 13 }}>
              <span>Age: {patient.age || 'N/A'}</span>
              <span>•</span>
              <span>Gender: {pUser?.gender || 'N/A'}</span>
              <span>•</span>
              <span>Blood: <Badge label={patient.bloodType || 'N/A'} color={colors.danger} light /></span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Printer size={16} /> Print</Button>
          <Button variant="primary" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Download size={16} /> PDF Report</Button>
        </div>
      </div>

      {/* HEALTH SCORE BANNER */}
      <Card style={{ marginBottom: 24, background: `linear-gradient(135deg, ${colors.primary}15, ${colors.success}15)`, border: `1px solid ${colors.primary}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', border: `4px solid ${colors.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: colors.success }}>85</div>
          <div>
            <h3 style={{ margin: 0, color: colors.text, fontSize: 16 }}>AI Health Score</h3>
            <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>Patient is in generally good health. No critical risks detected.</p>
          </div>
        </div>
        <div><Badge label="Risk: LOW" color={colors.success} /></div>
      </Card>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 8 }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* TAB CONTENT */}
          {activeTab === 'summary' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={18} color={colors.primary}/> Patient Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Height</span><div style={{ fontWeight: 600 }}>{patient.height || '--'} cm</div></div>
                <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Weight</span><div style={{ fontWeight: 600 }}>{patient.weight || '--'} kg</div></div>
                <div><span style={{ color: colors.textMuted, fontSize: 12 }}>BMI</span><div style={{ fontWeight: 600 }}>{patient.bmi || '--'}</div></div>
                <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Allergies</span><div style={{ fontWeight: 600 }}>{patient.allergies?.join(', ') || 'None'}</div></div>
                <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Existing Diseases</span><div style={{ fontWeight: 600 }}>{patient.chronicConditions?.join(', ') || 'None'}</div></div>
                <div><span style={{ color: colors.textMuted, fontSize: 12 }}>Emergency Contact</span><div style={{ fontWeight: 600 }}>{patient.emergencyContact?.name || '--'} ({patient.emergencyContact?.phone || '--'})</div></div>
              </div>
            </Card>
          )}

          {activeTab === 'vitals' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={18} color={colors.danger}/> Vital Signs (Latest)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                 <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Heart size={20} color={colors.danger} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>72 <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>bpm</span></div><div style={{fontSize:11, color:colors.textMuted}}>Heart Rate</div></div>
                 <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Thermometer size={20} color={colors.warning} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>98.6 <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>°F</span></div><div style={{fontSize:11, color:colors.textMuted}}>Temperature</div></div>
                 <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Droplets size={20} color={colors.primary} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>120/80 <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>mmHg</span></div><div style={{fontSize:11, color:colors.textMuted}}>Blood Pressure</div></div>
                 <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Wind size={20} color={colors.info} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>98 <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>%</span></div><div style={{fontSize:11, color:colors.textMuted}}>Oxygen (SpO2)</div></div>
                 <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Activity size={20} color={colors.success} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>16 <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>bpm</span></div><div style={{fontSize:11, color:colors.textMuted}}>Resp Rate</div></div>
                 <div style={{ padding: 16, background: colors.surfaceAlt, borderRadius: 8 }}><Droplets size={20} color={colors.warning} style={{marginBottom:8}}/><div style={{fontSize: 20, fontWeight: 700}}>95 <span style={{fontSize:12, fontWeight:400, color:colors.textMuted}}>mg/dL</span></div><div style={{fontSize:11, color:colors.textMuted}}>Blood Sugar</div></div>
              </div>
            </Card>
          )}

          {activeTab === 'diagnosis' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Stethoscope size={18} color={colors.primary}/> AI Diagnosis</h3>
              
              {diagnoses.length > 0 && (
                <div style={{ padding: 16, background: colors.primary+'10', borderRadius: 8, marginBottom: 20, border: `1px solid ${colors.primary}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>Primary Diagnosis</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: colors.primary }}>{diagnoses[0].primaryDiagnosis}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>Confidence</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: colors.success }}>{diagnoses[0].confidence}%</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>Possible Conditions: {diagnoses[0].possibleConditions?.join(', ')}</div>
                  <Badge label={`Risk: ${diagnoses[0].riskLevel}`} color={diagnoses[0].riskLevel === 'High' ? colors.danger : colors.warning} />
                </div>
              )}

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
                <h4 style={{ margin: '0 0 12px' }}>New Diagnosis Assessment</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Primary Diagnosis" value={diagnosisForm.primaryDiagnosis} onChange={e => setDiagnosisForm({...diagnosisForm, primaryDiagnosis: e.target.value})} placeholder="e.g. Type 2 Diabetes" />
                  <Input label="Risk Level" value={diagnosisForm.riskLevel} onChange={e => setDiagnosisForm({...diagnosisForm, riskLevel: e.target.value})} placeholder="Low / Medium / High" />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input label="Possible Conditions (comma separated)" value={diagnosisForm.possibleConditions} onChange={e => setDiagnosisForm({...diagnosisForm, possibleConditions: e.target.value})} placeholder="e.g. Hypertension, Obesity" />
                  </div>
                </div>
                <Button onClick={handleSaveDiagnosis} style={{ marginTop: 12 }}>Update Diagnosis & Generate AI Insights</Button>
              </div>
            </Card>
          )}

          {activeTab === 'labs' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Thermometer size={18} color={colors.warning}/> Lab Test Recommendations</h3>
              {labRecommendations.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  {labRecommendations.map((lab, i) => (
                    <div key={i} style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{lab.testName} <Badge label={lab.priority} color={lab.priority === 'High' ? colors.danger : colors.info} light /></div>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>{lab.reason} • {lab.preparationInstructions}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>{lab.status}</div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 12px' }}>Recommend New Test</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Test Name" value={labForm.testName} onChange={e=>setLabForm({...labForm, testName: e.target.value})} placeholder="e.g. HbA1c" />
                  <Input label="Priority" value={labForm.priority} onChange={e=>setLabForm({...labForm, priority: e.target.value})} placeholder="High/Medium/Low" />
                  <div style={{ gridColumn: '1 / -1' }}><Input label="Reason" value={labForm.reason} onChange={e=>setLabForm({...labForm, reason: e.target.value})} placeholder="e.g. Check blood sugar levels" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><Input label="Preparation Instructions" value={labForm.preparationInstructions} onChange={e=>setLabForm({...labForm, preparationInstructions: e.target.value})} placeholder="e.g. Fasting for 12 hours" /></div>
                </div>
                <Button onClick={handleSaveLab} variant="secondary" style={{ marginTop: 12 }}>Add Recommendation</Button>
              </div>
            </Card>
          )}

          {activeTab === 'meds' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Pill size={18} color={colors.success}/> Medication Recommendations</h3>
              <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Medicine" value={prescriptForm.medicineName} onChange={e=>setPrescriptForm({...prescriptForm, medicineName: e.target.value})} placeholder="e.g. Metformin" />
                  <Input label="Dosage" value={prescriptForm.dosage} onChange={e=>setPrescriptForm({...prescriptForm, dosage: e.target.value})} placeholder="e.g. 500 mg" />
                  <Input label="Frequency" value={prescriptForm.frequency} onChange={e=>setPrescriptForm({...prescriptForm, frequency: e.target.value})} placeholder="e.g. Twice Daily" />
                  <Input label="Duration" value={prescriptForm.duration} onChange={e=>setPrescriptForm({...prescriptForm, duration: e.target.value})} placeholder="e.g. 30 Days" />
                  <div style={{ gridColumn: '1 / -1' }}><Input label="Food Instructions" value={prescriptForm.instructions} onChange={e=>setPrescriptForm({...prescriptForm, instructions: e.target.value})} placeholder="e.g. After Food" /></div>
                </div>
                <Button onClick={handleSavePrescription} variant="secondary" style={{ marginTop: 12 }}>Add Prescription</Button>
              </div>
            </Card>
          )}

          {activeTab === 'followup' && (
             <Card>
             <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><CalendarClock size={18} color={colors.primary}/> Follow-Up Schedule</h3>
             {followUps.length > 0 && (
               <div style={{ marginBottom: 24 }}>
                 {followUps.map((fu, i) => (
                   <div key={i} style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                     <div style={{ fontWeight: 600 }}>{fu.type}</div>
                     <div style={{ color: colors.primary, fontWeight: 600 }}>{fu.timeline}</div>
                   </div>
                 ))}
               </div>
             )}
             <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}><Input label="Follow Up Type" value={followUpForm.type} onChange={e=>setFollowUpForm({...followUpForm, type: e.target.value})} placeholder="e.g. Next Visit" style={{marginBottom:0}}/></div>
                  <div style={{ flex: 1 }}><Input label="Timeline" value={followUpForm.timeline} onChange={e=>setFollowUpForm({...followUpForm, timeline: e.target.value})} placeholder="e.g. 7 Days" style={{marginBottom:0}}/></div>
                  <Button onClick={handleSaveFollowUp} variant="secondary">Schedule</Button>
                </div>
             </div>
           </Card>
          )}

          {activeTab === 'lifestyle' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Sun size={18} color={colors.warning}/> Lifestyle Recommendations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {["Walk 30 minutes daily", "Reduce sugar intake", "Drink 3L water", "Low sodium diet", "Stop smoking", "Avoid alcohol", "Sleep 8 hours", "Stress management"].map((tip, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: colors.surfaceAlt, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: colors.success, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</div>
                    {tip}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={colors.primary}/> Doctor Notes</h3>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Type your detailed medical notes and observations here..."
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 250, padding: 16, borderRadius: 8, border: `1px solid ${colors.border}`, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <Button onClick={handleSaveNotes} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16}/> Save Notes</Button>
                <Button variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><RefreshCw size={16}/> Generate AI Summary</Button>
              </div>
            </Card>
          )}

        </div>
        
        {/* RIGHT SIDEBAR (Quick Overview always visible) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h4 style={{ margin: '0 0 16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}>Recent Activity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.info+'15', color: colors.info, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16}/></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Vitals Updated</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>Today, 09:41 AM</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.success+'15', color: colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pill size={16}/></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Prescription Added</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>Yesterday, 04:20 PM</div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <h4 style={{ margin: '0 0 16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}>Disease Risk Prediction</h4>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>Type 2 Diabetes</span><span style={{ fontWeight: 700, color: colors.danger }}>82%</span></div>
              <div style={{ height: 6, background: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: '82%', height: '100%', background: colors.danger }}/></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>Hypertension</span><span style={{ fontWeight: 700, color: colors.warning }}>45%</span></div>
              <div style={{ height: 6, background: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: '45%', height: '100%', background: colors.warning }}/></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>Obesity</span><span style={{ fontWeight: 700, color: colors.info }}>20%</span></div>
              <div style={{ height: 6, background: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: '20%', height: '100%', background: colors.info }}/></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientProfile;

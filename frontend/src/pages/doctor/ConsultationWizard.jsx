import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input, Avatar } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { Check, ChevronRight, Activity, FileText, Pill, Thermometer, CalendarClock, Stethoscope, Save } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'History', icon: <FileText size={16} /> },
  { id: 2, label: 'Symptoms', icon: <Activity size={16} /> },
  { id: 3, label: 'Diagnosis', icon: <Stethoscope size={16} /> },
  { id: 4, label: 'Prescription', icon: <Pill size={16} /> },
  { id: 5, label: 'Labs', icon: <Thermometer size={16} /> },
  { id: 6, label: 'Follow-up', icon: <CalendarClock size={16} /> },
];

const ConsultationWizard = () => {
  const { appointmentId, patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  
  // State for the entire consultation payload
  const [consultation, setConsultation] = useState({
    symptoms: { complaint: '', duration: '', painLevel: 5 },
    vitals: { bloodPressure: '', heartRate: '', temperature: '', spO2: '', weight: '', height: '' },
    diagnosis: { primaryDiagnosis: '', possibleConditions: '', confidence: 85, riskLevel: 'Medium' },
    prescriptions: [],
    labRecommendations: [],
    followUp: { type: '', timeline: '' },
    notes: ''
  });

  // Local state for adding items to arrays
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  const [labForm, setLabForm] = useState({ testName: '', reason: '', priority: 'Medium' });

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const { data } = await API.get(`/api/medical/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setPatientData(data.data);
      } catch (err) {
        console.error('Failed to fetch patient history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [patientId, user?.token]);

  const addMedicine = () => {
    if (!medForm.name) return;
    setConsultation({ ...consultation, prescriptions: [...consultation.prescriptions, medForm] });
    setMedForm({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  };

  const addLabTest = () => {
    if (!labForm.testName) return;
    setConsultation({ ...consultation, labRecommendations: [...consultation.labRecommendations, labForm] });
    setLabForm({ testName: '', reason: '', priority: 'Medium' });
  };

  const submitConsultation = async () => {
    try {
      const payload = {
        appointmentId,
        patientId,
        ...consultation,
        diagnosis: {
          ...consultation.diagnosis,
          possibleConditions: consultation.diagnosis.possibleConditions.split(',').map(s => s.trim())
        }
      };
      
      await API.post('/api/medical/consultation', payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      alert('Consultation saved successfully!');
      navigate('/dashboard/doctor-appointments');
    } catch (err) {
      alert('Error saving consultation');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Consultation Setup...</div>;
  if (!patientData) return <div style={{ padding: 40, textAlign: 'center' }}>Patient not found</div>;

  const { patient, diagnoses, prescriptions } = patientData;

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER & PROGRESS BAR */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Active Consultation</h1>
            <p style={{ margin: 0, color: colors.textMuted }}>Patient: {patient.user?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="ghost" onClick={() => navigate('/dashboard/doctor-appointments')}>Cancel</Button>
            {currentStep === STEPS.length ? (
              <Button onClick={submitConsultation} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> Complete & Save</Button>
            ) : (
              <Button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Next Step <ChevronRight size={16}/></Button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colors.surface, padding: '16px 24px', borderRadius: 12, border: `1px solid ${colors.border}` }}>
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                  opacity: currentStep === step.id ? 1 : currentStep > step.id ? 0.8 : 0.4
                }}
                onClick={() => setCurrentStep(step.id)}
              >
                <div style={{ 
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentStep > step.id ? colors.success : currentStep === step.id ? colors.primary : colors.surfaceAlt,
                  color: currentStep >= step.id ? '#fff' : colors.textMuted
                }}>
                  {currentStep > step.id ? <Check size={18} /> : step.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: currentStep >= step.id ? colors.text : colors.textMuted }}>{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: currentStep > index + 1 ? colors.success : colors.surfaceAlt, margin: '0 16px', alignSelf: 'flex-start', marginTop: 18 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP CONTENT */}
      <Card style={{ minHeight: 400 }}>
        {currentStep === 1 && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>Patient Medical History</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 12px' }}>Basic Info</h4>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Age:</strong> {patient.age || 'N/A'}</p>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Blood Group:</strong> {patient.bloodType || 'N/A'}</p>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None'}</p>
                <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Chronic Diseases:</strong> {patient.chronicConditions?.join(', ') || 'None'}</p>
              </div>
              <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 12px' }}>Previous Diagnoses</h4>
                {diagnoses.length > 0 ? diagnoses.slice(0,3).map(d => (
                  <div key={d._id} style={{ fontSize: 14, marginBottom: 8 }}>• {d.primaryDiagnosis} ({new Date(d.createdAt).toLocaleDateString()})</div>
                )) : <div style={{ fontSize: 14, color: colors.textMuted }}>No previous diagnoses recorded.</div>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>Symptoms & Vitals</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h4 style={{ margin: '0 0 16px' }}>Current Symptoms</h4>
                <Input label="Chief Complaint" value={consultation.symptoms.complaint} onChange={e=>setConsultation({...consultation, symptoms: {...consultation.symptoms, complaint: e.target.value}})} placeholder="e.g., Severe headache" />
                <Input label="Duration" value={consultation.symptoms.duration} onChange={e=>setConsultation({...consultation, symptoms: {...consultation.symptoms, duration: e.target.value}})} placeholder="e.g., 3 days" />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Pain Level (1-10): {consultation.symptoms.painLevel}</label>
                  <input type="range" min="1" max="10" value={consultation.symptoms.painLevel} onChange={e=>setConsultation({...consultation, symptoms: {...consultation.symptoms, painLevel: e.target.value}})} style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 16px' }}>Clinical Vitals</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input label="Blood Pressure (mmHg)" value={consultation.vitals.bloodPressure} onChange={e=>setConsultation({...consultation, vitals: {...consultation.vitals, bloodPressure: e.target.value}})} placeholder="120/80" />
                  <Input label="Heart Rate (bpm)" value={consultation.vitals.heartRate} onChange={e=>setConsultation({...consultation, vitals: {...consultation.vitals, heartRate: e.target.value}})} placeholder="72" />
                  <Input label="Temperature (°F)" value={consultation.vitals.temperature} onChange={e=>setConsultation({...consultation, vitals: {...consultation.vitals, temperature: e.target.value}})} placeholder="98.6" />
                  <Input label="SpO2 (%)" value={consultation.vitals.spO2} onChange={e=>setConsultation({...consultation, vitals: {...consultation.vitals, spO2: e.target.value}})} placeholder="98" />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>Diagnosis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="Primary Diagnosis" value={consultation.diagnosis.primaryDiagnosis} onChange={e=>setConsultation({...consultation, diagnosis: {...consultation.diagnosis, primaryDiagnosis: e.target.value}})} placeholder="e.g., Acute Bronchitis" />
              <Input label="Risk Level" value={consultation.diagnosis.riskLevel} onChange={e=>setConsultation({...consultation, diagnosis: {...consultation.diagnosis, riskLevel: e.target.value}})} placeholder="Low / Medium / High" />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Differential / Possible Conditions (comma separated)" value={consultation.diagnosis.possibleConditions} onChange={e=>setConsultation({...consultation, diagnosis: {...consultation.diagnosis, possibleConditions: e.target.value}})} placeholder="e.g., Pneumonia, Asthma" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Doctor's Notes / Observations" value={consultation.notes} onChange={e=>setConsultation({...consultation, notes: e.target.value})} placeholder="Detailed clinical observations..." />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>Prescription</h2>
            
            {consultation.prescriptions.length > 0 && (
              <table style={{ width: '100%', marginBottom: 24, textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.surfaceAlt }}>
                    <th style={{ padding: 12 }}>Medicine</th>
                    <th style={{ padding: 12 }}>Dosage</th>
                    <th style={{ padding: 12 }}>Freq</th>
                    <th style={{ padding: 12 }}>Duration</th>
                    <th style={{ padding: 12 }}>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultation.prescriptions.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{m.name}</td>
                      <td style={{ padding: 12 }}>{m.dosage}</td>
                      <td style={{ padding: 12 }}>{m.frequency}</td>
                      <td style={{ padding: 12 }}>{m.duration}</td>
                      <td style={{ padding: 12 }}>{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px' }}>Add Medicine</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <Input label="Name" value={medForm.name} onChange={e=>setMedForm({...medForm, name: e.target.value})} placeholder="Paracetamol" />
                <Input label="Dosage" value={medForm.dosage} onChange={e=>setMedForm({...medForm, dosage: e.target.value})} placeholder="500mg" />
                <Input label="Frequency" value={medForm.frequency} onChange={e=>setMedForm({...medForm, frequency: e.target.value})} placeholder="1-0-1" />
                <Input label="Duration" value={medForm.duration} onChange={e=>setMedForm({...medForm, duration: e.target.value})} placeholder="5 Days" />
                <div style={{ gridColumn: '1 / span 3' }}><Input label="Instructions" value={medForm.instructions} onChange={e=>setMedForm({...medForm, instructions: e.target.value})} placeholder="After meals" /></div>
                <div style={{ alignSelf: 'end', marginBottom: 16 }}><Button onClick={addMedicine} style={{ width: '100%' }}>Add</Button></div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>Lab Recommendations</h2>
            
            {consultation.labRecommendations.length > 0 && (
              <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {consultation.labRecommendations.map((l, i) => (
                  <Badge key={i} label={`${l.testName} (${l.priority})`} color={colors.primary} />
                ))}
              </div>
            )}

            <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Test Name" value={labForm.testName} onChange={e=>setLabForm({...labForm, testName: e.target.value})} placeholder="e.g., CBC" />
                <Input label="Priority" value={labForm.priority} onChange={e=>setLabForm({...labForm, priority: e.target.value})} placeholder="High / Medium / Low" />
                <div style={{ gridColumn: '1 / -1' }}><Input label="Reason / Instructions" value={labForm.reason} onChange={e=>setLabForm({...labForm, reason: e.target.value})} placeholder="Routine checkup, fasting required" /></div>
              </div>
              <Button onClick={addLabTest} variant="secondary" style={{ marginTop: 12 }}>Add Test</Button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>Follow-up Schedule</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600 }}>
              <Input label="Follow-up Type" value={consultation.followUp.type} onChange={e=>setConsultation({...consultation, followUp: {...consultation.followUp, type: e.target.value}})} placeholder="e.g., Review Lab Reports" />
              <Input label="Timeline / Date" value={consultation.followUp.timeline} onChange={e=>setConsultation({...consultation, followUp: {...consultation.followUp, timeline: e.target.value}})} placeholder="e.g., After 7 days" />
            </div>
          </div>
        )}
      </Card>
      
      {/* BOTTOM NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button variant="secondary" onClick={handlePrev} disabled={currentStep === 1}>Previous</Button>
        {currentStep < STEPS.length && <Button onClick={handleNext}>Next Step</Button>}
        {currentStep === STEPS.length && <Button onClick={submitConsultation}>Complete Consultation</Button>}
      </div>

    </div>
  );
};

export default ConsultationWizard;

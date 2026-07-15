import React, { useState, useEffect } from 'react';
import { Card, Badge, Avatar, Button, Modal, Input, Select } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { Stethoscope, AlertCircle, Calendar, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Diagnosis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [diagnoses, setDiagnoses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    patient: '',
    primaryDiagnosis: '',
    symptoms: '',
    riskLevel: 'Medium',
    treatmentAdvice: '',
    labRecommendations: '',
    followUpDate: ''
  });

  const fetchDiagnoses = async () => {
    try {
      const { data } = await API.get('/api/medical/diagnosis', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setDiagnoses(data.data || []);
    } catch (err) {
      console.error("Failed to fetch diagnoses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await API.get('/api/doctors/patients', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setPatients(data.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
    fetchPatients();
  }, [user?.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.primaryDiagnosis) {
      toast.error('Patient and Primary Diagnosis are required');
      return;
    }

    try {
      const payload = {
        ...formData,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : [],
        labRecommendations: formData.labRecommendations ? formData.labRecommendations.split(',').map(s => s.trim()) : [],
        confidence: 100, // Explicitly provide confidence to prevent validation errors
      };
      
      if (!payload.followUpDate) {
        delete payload.followUpDate; // Prevent empty string from causing CastError to Date
      }

      await API.post('/api/medical/diagnosis', payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success('Diagnosis added successfully');
      setIsModalOpen(false);
      setFormData({
        patient: '',
        primaryDiagnosis: '',
        symptoms: '',
        riskLevel: 'Medium',
        treatmentAdvice: '',
        labRecommendations: '',
        followUpDate: ''
      });
      fetchDiagnoses(); // Refresh list
    } catch (err) {
      console.error("Failed to add diagnosis", err);
      toast.error(err.response?.data?.error || 'Failed to add diagnosis');
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Diagnosis Management</h1>
            <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Clinic-wide patient diagnosis tracking</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} style={{ marginRight: 8 }} /> Add Diagnosis
        </Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>Loading diagnoses...</div>
        ) : diagnoses.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>No Diagnoses Found</h3>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>You haven't added any patient diagnoses yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Primary Diagnosis</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Risk Level</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {diagnoses.map(d => (
                  <tr key={d._id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={d.patient?.user?.name || 'Unknown'} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{d.patient?.user?.name || 'Unknown Patient'}</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>{d.patient?.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: colors.primary, fontSize: 14 }}>{d.primaryDiagnosis}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.symptoms?.join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge label={d.riskLevel} color={d.riskLevel === 'High' ? colors.danger : d.riskLevel === 'Medium' ? colors.warning : colors.success} light />
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: colors.textMuted }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14}/> {new Date(d.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/dashboard/doctor-patients/${d.patient?._id}`)}>View Profile</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Diagnosis Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Diagnosis" width={600}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <Select 
            label="Select Patient *" 
            value={formData.patient} 
            onChange={(e) => setFormData({...formData, patient: e.target.value})}
            options={[
              { value: '', label: 'Select a patient' },
              ...patients.map(p => ({ value: p._id, label: p.name }))
            ]}
          />

          <Input 
            label="Primary Diagnosis *" 
            placeholder="e.g. Type 2 Diabetes" 
            value={formData.primaryDiagnosis} 
            onChange={(e) => setFormData({...formData, primaryDiagnosis: e.target.value})} 
          />

          <Input 
            label="Symptoms (comma separated)" 
            placeholder="e.g. Fatigue, Increased thirst" 
            value={formData.symptoms} 
            onChange={(e) => setFormData({...formData, symptoms: e.target.value})} 
          />

          <Select 
            label="Severity (Risk Level)" 
            value={formData.riskLevel} 
            onChange={(e) => setFormData({...formData, riskLevel: e.target.value})}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' }
            ]}
          />

          <Input 
            label="Treatment Advice" 
            placeholder="e.g. Strict diet, Metformin 500mg" 
            value={formData.treatmentAdvice} 
            onChange={(e) => setFormData({...formData, treatmentAdvice: e.target.value})} 
            multiline
            rows={3}
          />

          <Input 
            label="Lab Recommendations (comma separated)" 
            placeholder="e.g. HbA1c, Fasting Blood Sugar" 
            value={formData.labRecommendations} 
            onChange={(e) => setFormData({...formData, labRecommendations: e.target.value})} 
          />

          <Input 
            label="Follow-up Date" 
            type="date"
            value={formData.followUpDate} 
            onChange={(e) => setFormData({...formData, followUpDate: e.target.value})} 
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Diagnosis</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Diagnosis;

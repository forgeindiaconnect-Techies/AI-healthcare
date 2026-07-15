import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, ClipboardList, Clock, CheckCircle, X, Calendar, User, UserCircle } from 'lucide-react';

const DoctorTreatmentPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: '',
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    goals: '',
    instructions: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      
      // Fetch plans
      const plansRes = await API.get('/api/medical/treatment-plans', config);
      setPlans(plansRes.data.data);

      // Fetch patients from appointments to populate the dropdown
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
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title || !formData.startDate) {
      toast.error('Please fill in required fields: Patient, Title, and Start Date');
      return;
    }

    try {
      setSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      
      const payload = {
        ...formData,
        goals: formData.goals.split(',').map(g => g.trim()).filter(g => g)
      };

      await API.post('/api/medical/treatment-plans', payload, config);
      toast.success('Treatment Plan created successfully');
      setShowCreateModal(false);
      
      // Reset form
      setFormData({
        patientId: '',
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        goals: '',
        instructions: ''
      });
      
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create treatment plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading treatment plans...</div>;
  }

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Treatment Plans</h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Manage comprehensive treatment plans for your patients.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Create Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
            <ClipboardList size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>No Treatment Plans</h3>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>You haven't created any treatment plans yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <Card key={plan._id} style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>{plan.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textMuted, fontSize: 14 }}>
                    <UserCircle size={16} />
                    <span>{plan.patient?.user?.name || 'Unknown Patient'}</span>
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 10px', 
                  borderRadius: 12, 
                  fontSize: 12, 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: plan.status === 'Completed' ? '#dcfce7' : plan.status === 'Active' ? '#e0f2fe' : '#f3f4f6',
                  color: plan.status === 'Completed' ? '#166534' : plan.status === 'Active' ? '#075985' : '#4b5563'
                }}>
                  {plan.status === 'Completed' ? <CheckCircle size={12} /> : plan.status === 'Active' ? <Clock size={12} /> : <X size={12} />}
                  {plan.status}
                </div>
              </div>

              {plan.description && (
                <p style={{ margin: '0 0 16px', fontSize: 14, color: colors.text, lineHeight: 1.5 }}>
                  {plan.description}
                </p>
              )}

              <div style={{ background: colors.surfaceAlt, padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</h4>
                {plan.goals && plan.goals.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14 }}>
                    {plan.goals.map((goal, i) => <li key={i} style={{ marginBottom: 4 }}>{goal}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: colors.textMuted }}>No goals specified</p>
                )}
              </div>

              {plan.instructions && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: colors.textMuted }}>Instructions</h4>
                  <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{plan.instructions}</p>
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', gap: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textMuted }}>
                  <Calendar size={14} />
                  <span>Start: {new Date(plan.startDate).toLocaleDateString()}</span>
                </div>
                {plan.endDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textMuted }}>
                    <CheckCircle size={14} />
                    <span>End: {new Date(plan.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '100%', maxWidth: 600, padding: 24, margin: 20, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Create Treatment Plan</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color={colors.textMuted} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Patient <span style={{ color: 'red' }}>*</span></label>
                <select 
                  name="patientId" 
                  value={formData.patientId} 
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface }}
                >
                  <option value="">Select a patient...</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
                {patients.length === 0 && <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>No patients found. Patients must book an appointment first.</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Plan Title <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  required
                  placeholder="e.g. Hypertension Management Protocol"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}` }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  placeholder="Overview of the treatment plan..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, minHeight: 80, fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Start Date <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}` }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>End Date (Optional)</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={formData.endDate} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}` }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Goals (comma separated)</label>
                <input 
                  type="text" 
                  name="goals" 
                  value={formData.goals} 
                  onChange={handleChange}
                  placeholder="e.g. Reduce BP to 120/80, Lose 5kg"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}` }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Detailed Instructions</label>
                <textarea 
                  name="instructions" 
                  value={formData.instructions} 
                  onChange={handleChange}
                  placeholder="Specific daily instructions, diet restrictions, etc."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, minHeight: 120, fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DoctorTreatmentPlans;

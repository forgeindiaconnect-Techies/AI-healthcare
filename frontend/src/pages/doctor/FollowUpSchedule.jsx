import React, { useState, useEffect } from 'react';
import { Card, Badge, Avatar, Button, Modal, Input, Select } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { CalendarClock, AlertCircle, Calendar, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const FollowUpSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState(null);

  const [formData, setFormData] = useState({
    patient: '',
    appointmentDate: '',
    appointmentTime: '',
    mode: 'in-person',
    priority: 'Medium',
    reason: ''
  });

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/appointments?type=follow-up', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFollowups(data.data || []);
    } catch (err) {
      console.error("Failed to fetch follow-ups:", err);
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await API.get('/api/doctors/patients', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPatients(data.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  useEffect(() => {
    fetchFollowups();
    fetchPatients();
  }, [user.token]);

  const handleOpenModal = (apt = null) => {
    if (apt) {
      setIsEditMode(true);
      setSelectedAptId(apt._id);
      setFormData({
        patient: apt.patient?._id || '',
        appointmentDate: new Date(apt.appointmentDate).toISOString().split('T')[0],
        appointmentTime: apt.appointmentTime,
        mode: apt.mode || 'in-person',
        priority: apt.priority || 'Medium',
        reason: apt.reason || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedAptId(null);
      setFormData({
        patient: '',
        appointmentDate: '',
        appointmentTime: '',
        mode: 'in-person',
        priority: 'Medium',
        reason: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.appointmentDate || !formData.appointmentTime || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (isEditMode) {
        await API.put(`/api/appointments/${selectedAptId}`, formData, config);
        toast.success('Follow-up updated successfully');
      } else {
        await API.post('/api/appointments', { ...formData, type: 'follow-up' }, config);
        toast.success('Follow-up scheduled successfully');
      }
      setIsModalOpen(false);
      fetchFollowups();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save follow-up');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/appointments/${id}/status`, { status }, config);
      toast.success(`Follow-up marked as ${status}`);
      fetchFollowups();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return colors.danger;
      case 'Medium': return colors.warning;
      case 'Low': return colors.success;
      default: return colors.info;
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.info + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.info }}>
            <CalendarClock size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Follow-up Schedule</h1>
            <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Manage all upcoming patient appointments</p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Schedule Follow-up</Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>Loading schedule...</div>
        ) : followups.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>No Follow-ups Scheduled</h3>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>You don't have any patient follow-ups scheduled.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Date & Time</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Mode</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map(fu => (
                  <tr key={fu._id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={fu.patient?.name || 'Unknown'} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{fu.patient?.name || 'Unknown Patient'}</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>{fu.patient?.phone || fu.patient?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{new Date(fu.appointmentDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>{fu.appointmentTime}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: 13, textTransform: 'capitalize' }}>{fu.mode}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge label={fu.priority || 'Medium'} color={getPriorityColor(fu.priority)} light />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge label={fu.status} color={fu.status === 'completed' ? colors.success : fu.status === 'cancelled' || fu.status === 'no-show' ? colors.danger : colors.info} light />
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {fu.status !== 'completed' && fu.status !== 'cancelled' && (
                          <>
                            <button onClick={() => handleStatusChange(fu._id, 'completed')} title="Mark Completed" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colors.success }}>
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleOpenModal(fu)} title="Edit" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colors.primary }}>
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleStatusChange(fu._id, 'cancelled')} title="Cancel" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colors.danger }}>
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/dashboard/doctor-patients/${fu.patient?._id}`)}>Profile</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Follow-up" : "Schedule Follow-up"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select 
            label="Select Patient" 
            value={formData.patient} 
            onChange={(e) => setFormData({...formData, patient: e.target.value})}
            options={[
              { label: 'Select a patient...', value: '' },
              ...patients.map(p => ({ label: p.user?.name || 'Unknown', value: p.user?._id }))
            ]}
          />
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Input 
                label="Date" 
                type="date" 
                value={formData.appointmentDate} 
                onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input 
                label="Time" 
                type="time" 
                value={formData.appointmentTime} 
                onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Select 
                label="Visit Type" 
                value={formData.mode} 
                onChange={(e) => setFormData({...formData, mode: e.target.value})}
                options={[
                  { label: 'In-person', value: 'in-person' },
                  { label: 'Video Call', value: 'video' },
                  { label: 'Phone Call', value: 'phone' }
                ]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select 
                label="Priority" 
                value={formData.priority} 
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                options={[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' }
                ]}
              />
            </div>
          </div>

          <Input 
            label="Notes / Reason for Follow-up" 
            value={formData.reason} 
            onChange={(e) => setFormData({...formData, reason: e.target.value})} 
            placeholder="e.g., Check blood pressure progress"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{isEditMode ? "Update Follow-up" : "Schedule Follow-up"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FollowUpSchedule;

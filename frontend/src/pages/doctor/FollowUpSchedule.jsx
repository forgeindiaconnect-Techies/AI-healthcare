import React, { useState, useEffect } from 'react';
import { Card, Badge, Avatar, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { CalendarClock, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FollowUpSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        const { data } = await API.get('/api/medical/followup', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFollowups(data.data || []);
      } catch (err) {
        console.error("Failed to fetch follow-ups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowups();
  }, [user.token]);

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.info + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.info }}>
          <CalendarClock size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Follow-up Schedule</h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Manage all upcoming patient appointments</p>
        </div>
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
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Follow-up Type</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Timeline</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Date Scheduled</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map(fu => (
                  <tr key={fu._id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={fu.patient?.user?.name || 'Unknown'} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{fu.patient?.user?.name || 'Unknown Patient'}</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>{fu.patient?.user?.phone || fu.patient?.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{fu.type}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: colors.primary, fontSize: 14 }}>{fu.timeline}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge label={fu.status} color={fu.status === 'Completed' ? colors.success : fu.status === 'Missed' ? colors.danger : colors.info} light />
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: colors.textMuted }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14}/> {new Date(fu.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/dashboard/doctor-patients/${fu.patient?._id}`)}>View Profile</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FollowUpSchedule;

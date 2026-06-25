import React, { useState, useEffect } from 'react';
import { Card, Badge, Avatar, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { Thermometer, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LabRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const { data } = await API.get('/api/medical/lab-recommendations', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setLabs(data.data || []);
      } catch (err) {
        console.error("Failed to fetch lab recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, [user.token]);

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.warning + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.warning }}>
          <Thermometer size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Lab Recommendations</h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Track prescribed tests across all patients</p>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>Loading lab tests...</div>
        ) : labs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
              <AlertCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>No Lab Recommendations</h3>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>You haven't prescribed any lab tests yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Test Name</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Priority</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labs.map(lab => (
                  <tr key={lab._id} style={{ borderBottom: `1px solid ${colors.border}`, transition: 'background 0.2s' }} className="hover:bg-gray-50">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={lab.patient?.user?.name || 'Unknown'} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{lab.patient?.user?.name || 'Unknown Patient'}</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>{lab.patient?.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{lab.testName}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lab.reason}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge label={lab.priority} color={lab.priority === 'High' ? colors.danger : lab.priority === 'Medium' ? colors.warning : colors.info} light />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <Badge label={lab.status} color={lab.status === 'Completed' ? colors.success : colors.primary} light />
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: colors.textMuted }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14}/> {new Date(lab.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/dashboard/doctor-patients/${lab.patient?._id}`)}>View Profile</Button>
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

export default LabRecommendations;

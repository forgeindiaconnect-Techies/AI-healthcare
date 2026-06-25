import React, { useState, useEffect } from 'react';
import { Card, Badge, Avatar, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import { Stethoscope, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Diagnosis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnoses = async () => {
      try {
        const { data } = await API.get('/api/medical/diagnosis', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDiagnoses(data.data || []);
      } catch (err) {
        console.error("Failed to fetch diagnoses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnoses();
  }, [user.token]);

  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
          <Stethoscope size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Diagnosis Management</h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Clinic-wide patient diagnosis tracking</p>
        </div>
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
                  <th style={{ padding: '16px 24px', fontSize: 12, textTransform: 'uppercase', color: colors.textMuted, fontWeight: 600 }}>Confidence</th>
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
                        {d.possibleConditions?.join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 40, height: 6, borderRadius: 3, background: colors.surfaceAlt, overflow: 'hidden' }}>
                          <div style={{ width: `${d.confidence}%`, height: '100%', background: colors.success }}></div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{d.confidence}%</span>
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
    </div>
  );
};

export default Diagnosis;

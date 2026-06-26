import React from 'react';
import { Card } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';

const UploadReports = () => {
  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>Upload Medical Reports</h1>
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>This feature is currently under development.</p>
      </div>

      <Card style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
          <span style={{ fontSize: 32 }}>🚧</span>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Coming Soon</h3>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>We are actively building the Upload Medical Reports module. Check back soon!</p>
      </Card>
    </div>
  );
};

export default UploadReports;

const fs = require('fs');
const path = require('path');

const pages = [
  // Patient Pages
  { path: 'patient/UploadReports.jsx', name: 'UploadReports', title: 'Upload Medical Reports' },
  { path: 'patient/LabResults.jsx', name: 'LabResults', title: 'Lab Test Results' },
  { path: 'patient/TreatmentPlan.jsx', name: 'TreatmentPlan', title: 'Treatment Plan' },
  { path: 'patient/HealthSummary.jsx', name: 'HealthSummary', title: 'Health Summary' },
  { path: 'patient/DoctorRecommendations.jsx', name: 'DoctorRecommendations', title: 'Doctor Recommendations' },
  { path: 'patient/PaymentHistory.jsx', name: 'PaymentHistory', title: 'Payment History' },
  { path: 'patient/PatientFollowUps.jsx', name: 'PatientFollowUps', title: 'Follow-up Schedule' },
  { path: 'patient/Notifications.jsx', name: 'PatientNotifications', title: 'Notifications' },
  // Doctor Pages
  { path: 'doctor/ReviewReports.jsx', name: 'ReviewReports', title: 'Review Uploaded Reports' },
  { path: 'doctor/DoctorTreatmentPlans.jsx', name: 'DoctorTreatmentPlans', title: 'Treatment Plans' },
  { path: 'doctor/GenerateReport.jsx', name: 'GenerateReport', title: 'Generate Medical Report (PDF)' },
  // Admin Pages
  { path: 'admin/AdminReports.jsx', name: 'AdminReports', title: 'Manage Medical Reports' },
  { path: 'admin/AdminPrescriptions.jsx', name: 'AdminPrescriptions', title: 'Manage Prescriptions' },
  { path: 'admin/AdminPayments.jsx', name: 'AdminPayments', title: 'Manage Payments' },
  { path: 'admin/AdminVideoConsults.jsx', name: 'AdminVideoConsults', title: 'Manage Video Consultations' },
  { path: 'admin/Notifications.jsx', name: 'AdminNotifications', title: 'Notifications' },
];

const template = (name, title) => `import React from 'react';
import { Card } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';

const ${name} = () => {
  return (
    <div style={{ padding: 24, fontFamily: "'Inter', sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: colors.text }}>${title}</h1>
        <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>This feature is currently under development.</p>
      </div>

      <Card style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: colors.textMuted }}>
          <span style={{ fontSize: 32 }}>🚧</span>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Coming Soon</h3>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>We are actively building the ${title} module. Check back soon!</p>
      </Card>
    </div>
  );
};

export default ${name};
`;

pages.forEach(p => {
  const fullPath = path.join(__dirname, 'src/pages', p.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Only write if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, template(p.name, p.title));
    console.log('Created:', fullPath);
  }
});

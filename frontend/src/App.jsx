import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthPage from './pages/AuthPage';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorRegister from './pages/auth/DoctorRegister';
import LandingPage from './pages/Landing';

import DashboardLayout from './components/layout/DashboardLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientAppointments from './pages/patient/PatientAppointments';
import MedicalReports from './pages/patient/MedicalReports';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import PatientManagement from './pages/doctor/PatientManagement';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import MedicalHistory from './pages/patient/MedicalHistory';
import PatientCommunication from './pages/doctor/PatientCommunication';
import DoctorCommunication from './pages/patient/DoctorCommunication';
import SymptomChecker from './pages/patient/SymptomChecker';
import HealthChat from './pages/patient/HealthChat';
import DiabetesDiet from './pages/patient/DiabetesDiet';
import BMIAnalysis from './pages/patient/BMIAnalysis';
import Emergency from './pages/patient/Emergency';
import Billing from './pages/patient/Billing';
import PatientProfile from './pages/patient/PatientProfile';
import DoctorAIAnalysis from './pages/doctor/DoctorAIAnalysis';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorPatientProfile from './pages/doctor/DoctorPatientProfile';
import Diagnosis from './pages/doctor/Diagnosis';
import LabRecommendations from './pages/doctor/LabRecommendations';
import FollowUpSchedule from './pages/doctor/FollowUpSchedule';
import ConsultationWizard from './pages/doctor/ConsultationWizard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import AnalyticsReports from './pages/admin/AnalyticsReports';
import UserManagement from './pages/admin/UserManagement';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPatientManagement from './pages/admin/AdminPatientManagement';
import AdminAppointments from './pages/admin/AdminAppointments';

// NEW PATIENT IMPORTS
import UploadReports from './pages/patient/UploadReports';
import LabResults from './pages/patient/LabResults';
import TreatmentPlan from './pages/patient/TreatmentPlan';
import HealthSummary from './pages/patient/HealthSummary';
import DoctorRecommendations from './pages/patient/DoctorRecommendations';
import PaymentHistory from './pages/patient/PaymentHistory';
import PatientFollowUps from './pages/patient/PatientFollowUps';
import MyDiagnoses from './pages/patient/MyDiagnoses';

// NEW DOCTOR IMPORTS
import ReviewReports from './pages/doctor/ReviewReports';
import DoctorTreatmentPlans from './pages/doctor/DoctorTreatmentPlans';
import GenerateReport from './pages/doctor/GenerateReport';

// NEW ADMIN IMPORTS
import AdminReports from './pages/admin/AdminReports';
import AdminPrescriptions from './pages/admin/AdminPrescriptions';
import AdminPayments from './pages/admin/AdminPayments';
import AdminVideoConsults from './pages/admin/AdminVideoConsults';

// Shared
import VideoConsultation from './pages/consultation/VideoConsultation';

const AppointmentsRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'patient') return <PatientAppointments />;
  if (user?.role === 'doctor') return <DoctorAppointments />;
  if (user?.role === 'admin') return <AdminAppointments />;
  return <div className="p-6 bg-white rounded-xl shadow-sm"><h2 className="text-2xl font-bold">Appointments</h2><p className="mt-2 text-gray-500">Coming soon.</p></div>;
};

const PrescriptionsRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <DoctorPrescriptions />;
  if (user?.role === 'patient') return <PatientPrescriptions />;
  return <div className="p-6 bg-white rounded-xl shadow-sm"><h2 className="text-2xl font-bold">Prescriptions</h2><p className="mt-2 text-gray-500">Coming soon.</p></div>;
};

import DoctorNotifications from './pages/doctor/DoctorNotifications';
import PatientNotifications from './pages/patient/Notifications';
const NotificationsRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminNotifications />;
  if (user?.role === 'doctor') return <DoctorNotifications />;
  if (user?.role === 'patient') return <PatientNotifications />;
  return <div className="p-6 bg-white rounded-xl shadow-sm"><h2 className="text-2xl font-bold">Notifications</h2><p className="mt-2 text-gray-500">Coming soon.</p></div>;
};

const ProfileRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'doctor') return <DoctorProfile />;
  if (user?.role === 'patient') return <PatientProfile />;
  return <div className="p-6 bg-white rounded-xl shadow-sm"><h2 className="text-2xl font-bold">Profile</h2><p className="mt-2 text-gray-500">Coming soon.</p></div>;
};

import { SocketProvider } from './context/SocketContext';
import { ROLES } from './auth/roles';
import ProtectedRoute from './auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

const RoleRoute = ({ role, children }) => {
  const { user } = useAuth();
  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const DashboardIndex = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="admin" replace />;
  if (user?.role === 'doctor') return <Navigate to="doctor-dashboard" replace />;
  return <Navigate to="patients" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />
            <Route path="/doctor-register" element={<DoctorRegister />} />
            <Route path="/admin-login" element={<AuthPage />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              {/* Redirect /dashboard to role-specific root automatically */}
              <Route index element={<DashboardIndex />} />

              {/* Patient Routes */}
              <Route path="patients" element={<RoleRoute role="patient"><PatientDashboard /></RoleRoute>} />
              <Route path="my-diagnoses" element={<RoleRoute role="patient"><MyDiagnoses /></RoleRoute>} />
              <Route path="symptoms" element={<RoleRoute role="patient"><SymptomChecker /></RoleRoute>} />
              <Route path="ai-chat" element={<RoleRoute role="patient"><HealthChat /></RoleRoute>} />
              <Route path="diabetes-diet" element={<RoleRoute role="patient"><DiabetesDiet /></RoleRoute>} />
              <Route path="bmi" element={<RoleRoute role="patient"><BMIAnalysis /></RoleRoute>} />
              <Route path="reports" element={<RoleRoute role="patient"><MedicalReports /></RoleRoute>} />
              <Route path="history" element={<RoleRoute role="patient"><MedicalHistory /></RoleRoute>} />
              <Route path="emergency" element={<RoleRoute role="patient"><Emergency /></RoleRoute>} />
              <Route path="billing" element={<RoleRoute role="patient"><Billing /></RoleRoute>} />
              <Route path="upload-reports" element={<RoleRoute role="patient"><UploadReports /></RoleRoute>} />
              <Route path="lab-results" element={<RoleRoute role="patient"><LabResults /></RoleRoute>} />
              <Route path="treatment-plan" element={<RoleRoute role="patient"><TreatmentPlan /></RoleRoute>} />
              <Route path="health-summary" element={<RoleRoute role="patient"><HealthSummary /></RoleRoute>} />
              <Route path="doctor-recommendations" element={<RoleRoute role="patient"><DoctorRecommendations /></RoleRoute>} />
              <Route path="payment-history" element={<RoleRoute role="patient"><PaymentHistory /></RoleRoute>} />
              <Route path="patient-follow-ups" element={<RoleRoute role="patient"><PatientFollowUps /></RoleRoute>} />

              {/* Doctor Routes */}
              <Route path="doctor-dashboard" element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />
              <Route path="doctor-patients" element={<RoleRoute role="doctor"><PatientManagement /></RoleRoute>} />
              <Route path="doctor-patients/:id" element={<RoleRoute role="doctor"><DoctorPatientProfile /></RoleRoute>} />
              <Route path="consultation/:appointmentId/:patientId" element={<RoleRoute role="doctor"><ConsultationWizard /></RoleRoute>} />
              <Route path="diagnosis" element={<RoleRoute role="doctor"><Diagnosis /></RoleRoute>} />
              <Route path="lab-recommendations" element={<RoleRoute role="doctor"><LabRecommendations /></RoleRoute>} />
              <Route path="follow-up" element={<RoleRoute role="doctor"><FollowUpSchedule /></RoleRoute>} />
              <Route path="ai-analysis" element={<RoleRoute role="doctor"><DoctorAIAnalysis /></RoleRoute>} />
              <Route path="chat" element={<RoleRoute role="doctor"><PatientCommunication /></RoleRoute>} />
              <Route path="review-reports" element={<RoleRoute role="doctor"><ReviewReports /></RoleRoute>} />
              <Route path="doctor-treatment-plans" element={<RoleRoute role="doctor"><DoctorTreatmentPlans /></RoleRoute>} />
              <Route path="generate-report" element={<RoleRoute role="doctor"><GenerateReport /></RoleRoute>} />

              {/* Admin Routes */}
              <Route path="admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
              <Route path="users" element={<RoleRoute role="admin"><UserManagement /></RoleRoute>} />
              <Route path="doctors" element={<RoleRoute role="admin"><DoctorManagement /></RoleRoute>} />
              <Route path="analytics" element={<RoleRoute role="admin"><AnalyticsReports /></RoleRoute>} />
              <Route path="settings" element={<RoleRoute role="admin"><AdminSettings /></RoleRoute>} />
              <Route path="admin-reports" element={<RoleRoute role="admin"><AdminReports /></RoleRoute>} />
              <Route path="admin-prescriptions" element={<RoleRoute role="admin"><AdminPrescriptions /></RoleRoute>} />
              <Route path="admin-payments" element={<RoleRoute role="admin"><AdminPayments /></RoleRoute>} />
              <Route path="admin-video-consults" element={<RoleRoute role="admin"><AdminVideoConsults /></RoleRoute>} />

              {/* Shared Routes based on role */}
              <Route path="notifications" element={<NotificationsRouter />} />
              <Route path="appointments" element={<AppointmentsRouter />} />
              <Route path="prescriptions" element={<PrescriptionsRouter />} />
              <Route path="profile" element={<ProfileRouter />} />
            </Route>

            {/* Consultation Route (No Sidebar Layout) */}
            <Route 
              path="/consultation/:roomId" 
              element={
                <ProtectedRoute>
                  <VideoConsultation />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<div className="p-8 text-center text-red-500 font-bold">404 - Not Found</div>} />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

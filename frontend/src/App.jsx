import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthPage from './pages/AuthPage';
import DoctorLogin from './pages/auth/DoctorLogin';
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
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import AnalyticsReports from './pages/admin/AnalyticsReports';
import UserManagement from './pages/admin/UserManagement';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import AdminPatientManagement from './pages/admin/AdminPatientManagement';
import AdminAppointments from './pages/admin/AdminAppointments';
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
const NotificationsRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminNotifications />;
  if (user?.role === 'doctor') return <DoctorNotifications />;
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
            
            <Route 
              path="/doctor-dashboard" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.DOCTOR, ROLES.ADMIN]} redirectTo="/doctor-login">
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<DoctorDashboard />} />
            </Route>

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              {/* Redirect /dashboard to role-specific root automatically */}
              <Route index element={<Navigate to="patients" replace />} />

              {/* Patient Routes */}
              <Route path="patients" element={<PatientDashboard />} />
              <Route path="symptoms" element={<SymptomChecker />} />
              <Route path="ai-chat" element={<HealthChat />} />
              <Route path="diabetes-diet" element={<DiabetesDiet />} />
              <Route path="bmi" element={<BMIAnalysis />} />
              <Route path="reports" element={<MedicalReports />} />
              <Route path="history" element={<MedicalHistory />} />
              <Route path="emergency" element={<Emergency />} />
              <Route path="billing" element={<Billing />} />

              {/* Doctor Routes */}
              <Route path="doctor-patients" element={<PatientManagement />} />
              <Route path="doctor-patients/:id" element={<DoctorPatientProfile />} />
              <Route path="diagnosis" element={<Diagnosis />} />
              <Route path="lab-recommendations" element={<LabRecommendations />} />
              <Route path="follow-up" element={<FollowUpSchedule />} />
              <Route path="ai-analysis" element={<DoctorAIAnalysis />} />
              <Route path="chat" element={<PatientCommunication />} />

              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="doctors" element={<DoctorManagement />} />
              <Route path="analytics" element={<AnalyticsReports />} />
              <Route path="settings" element={<AdminSettings />} />

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

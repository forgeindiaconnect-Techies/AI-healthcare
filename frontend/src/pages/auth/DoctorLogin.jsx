import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Button, Input } from '../../components/ui/SharedUI';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!form.email || !form.password) { 
      setError("Please fill all fields"); 
      return; 
    }
    setLoading(true); 
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await API.post("/api/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      const token = response.data.token || response.data.accessToken;
      const doctor = response.data.doctor || response.data.user || response.data.data;

      // Make sure it's a doctor
      if (doctor?.role !== 'doctor' && doctor?.role !== 'admin') {
         setError("Access denied. Doctor privileges required.");
         return;
      }

      // Check approval status
      const isApproved =
        doctor?.role === "doctor" &&
        doctor?.approvalStatus === "approved" &&
        doctor?.isVerified === true &&
        doctor?.isLicenseVerified === true;

      if (!isApproved && doctor?.role !== 'admin') {
        if (doctor?.approvalStatus === "pending") {
          navigate("/approval-pending");
          return;
        }

        if (doctor?.approvalStatus === "rejected") {
          navigate("/registration-rejected", { state: { message: doctor.rejectionReason || "Registration rejected" } });
          return;
        }

        throw new Error("Doctor account verification is incomplete.");
      }

      // Valid doctor, store token
      localStorage.setItem("doctorToken", token);
      localStorage.setItem("userRole", doctor.role);
      localStorage.setItem("doctor", JSON.stringify(doctor));

      // Also set userInfo so AuthContext works too
      localStorage.setItem("userInfo", JSON.stringify({ ...doctor, token }));

      navigate("/dashboard/doctor", { replace: true });
    } catch (err) {
      let message = err.message || "Authentication failed";
      if (err.response && err.response.data) {
        if (err.response.data.code === 'DOCTOR_APPROVAL_PENDING') {
          navigate('/approval-pending');
          return;
        }
        if (err.response.data.code === 'DOCTOR_ACCOUNT_REJECTED') {
          navigate('/registration-rejected', { state: { message: err.response.data.message } });
          return;
        }
        message = err.response.data.error || err.response.data.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #EFF6FF, #F0FDF4)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: colors.surface, borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, border: `1px solid ${colors.border}` }}>
        <button onClick={() => navigate('/')} style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>← Back to Home</button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍⚕️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.text, margin: "0 0 6px" }}>Doctor Login</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Secure Portal Access</p>
        </div>



        <form autoComplete="off" onSubmit={handleSubmit}>
          <Input label="Email Address" type="email" name="healthai_doctor_email" autoComplete="off" value={form.email} onChange={e => set("email", e.target.value)} placeholder="doctor@healthsys.com" icon="📧" />
          <Input label="Password" type="password" name="healthai_doctor_password" autoComplete="new-password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" icon="🔒" />
          
          {error && <div style={{ background: `${colors.danger}15`, color: colors.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
          
          <Button variant="primary" type="submit" disabled={isSubmitting} style={{ width: "100%", padding: "13px", fontSize: 15 }}>
            {isSubmitting ? "Authenticating..." : "Login to Portal →"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DoctorLogin;

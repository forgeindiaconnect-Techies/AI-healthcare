import React, { useEffect } from 'react';
import { colors } from '../../theme/colors';

export const Avatar = ({ name, size = 36, bg = colors.primary }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: size * 0.36, flexShrink: 0 }}>
    {name?.slice(0, 2).toUpperCase()}
  </div>
);

export const Badge = ({ label, color = colors.primary, light = false }) => (
  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: light ? color + "18" : color, color: light ? color : "#fff", letterSpacing: 0.3 }}>{label}</span>
);

export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "20px 24px", ...style, cursor: onClick ? "pointer" : "default" }}>{children}</div>
);

export const StatCard = ({ icon, label, value, sub, color = colors.primary, trend, onClick }) => (
  <Card onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 16, transition: "transform 0.2s ease, box-shadow 0.2s ease" }} className="hover:-translate-y-1 hover:shadow-xl group">
    <div style={{ width: 52, height: 52, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: trend === "up" ? colors.success : trend === "down" ? colors.danger : colors.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);

export const Button = ({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) => {
  const variants = {
    primary: { background: colors.primary, color: "#fff", border: "none" },
    secondary: { background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}` },
    danger: { background: colors.danger, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: colors.primary, border: `1px solid ${colors.primary}` },
    success: { background: colors.success, color: "#fff", border: "none" },
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "9px 20px", fontSize: 14 }, lg: { padding: "12px 28px", fontSize: 15 } };
  return (
    <button onClick={onClick} disabled={disabled} style={{ borderRadius: 8, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, transition: "all 0.15s", ...variants[variant], ...sizes[size], ...style }}>
      {children}
    </button>
  );
};

import { Eye, EyeOff } from 'lucide-react';

export const Input = ({ label, type = "text", value, onChange, placeholder, icon, style = {} }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const currentType = isPassword && showPassword ? "text" : type;

  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{label}</label>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && <span style={{ position: "absolute", left: 12, fontSize: 18 }}>{icon}</span>}
        <input type={currentType} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: icon ? "10px 12px 10px 40px" : "10px 12px", paddingRight: isPassword ? "40px" : "12px", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, color: colors.text, background: colors.surface, outline: "none" }} />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            style={{ position: "absolute", right: 12, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, padding: 0 }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{label}</label>}
    <select value={value} onChange={onChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, color: colors.text, background: colors.surface, outline: "none" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Spinner = ({ size = 24, color = colors.primary }) => (
  <div style={{ width: size, height: size, border: `3px solid ${color}20`, borderTop: `3px solid ${color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
);

export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: colors.surface, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: colors.textMuted }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
      </div>
    </div>
  );
};

export const Toast = ({ msg, type, onClose }) => {
  const typeColors = { success: colors.success, error: colors.danger, info: colors.info, warning: colors.warning };
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: colors.surface, border: `1px solid ${colors.border}`, borderLeft: `4px solid ${typeColors[type] || colors.primary}`, borderRadius: 10, padding: "14px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", zIndex: 2000, maxWidth: 360, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 20 }}>{type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️"}</span>
      <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted }}>✕</button>
    </div>
  );
};

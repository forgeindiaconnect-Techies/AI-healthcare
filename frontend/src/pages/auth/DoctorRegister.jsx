import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    hospitalName: '',
    facilityType: 'Clinic',
    location: {
      street: '', city: '', state: '', zipCode: '', country: ''
    },
    consultationFee: '',
    licenseNumber: '',
    docLicense: '',
    docDegree: '',
    docId: '',
    docClinic: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // We'll call API directly if context register doesn't support complex objects out of box, or just adapt it.

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'healthai_doctor_register_email') name = 'email';
    if (name === 'healthai_doctor_register_password') name = 'password';

    if (['street', 'city', 'state', 'zipCode', 'country'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [name]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const documents = [];
      if (formData.docLicense) documents.push({ title: 'Medical License', fileUrl: formData.docLicense, fileType: 'url' });
      if (formData.docDegree) documents.push({ title: 'Degree Certificate', fileUrl: formData.docDegree, fileType: 'url' });
      if (formData.docId) documents.push({ title: 'Government ID', fileUrl: formData.docId, fileType: 'url' });
      if (formData.docClinic) documents.push({ title: 'Clinic Registration Proof', fileUrl: formData.docClinic, fileType: 'url' });

      const payload = { ...formData, documents, role: 'doctor' };
      delete payload.docLicense;
      delete payload.docDegree;
      delete payload.docId;
      delete payload.docClinic;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success || response.ok) {
        toast.success("Registration successful! Please wait for admin approval.");
        navigate('/doctor-login');
      } else {
        let errorMessage = data.error || 'Failed to register as doctor';
        if (data.details && data.details.length > 0) {
          errorMessage = data.details.map(d => d.message).join(', ');
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl mb-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>
      <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-teal-100 p-3 rounded-full">
              <Activity className="h-10 w-10 text-teal-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Doctor Registration</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already registered?{' '}
            <Link to="/doctor-login" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
              Sign in to Doctor Portal
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Personal Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.name} autoComplete="off" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input name="healthai_doctor_register_email" type="email" autoComplete="off" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.email} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input name="healthai_doctor_register_password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" onChange={handleChange} value={formData.password} />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input name="phone" type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.phone} />
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Professional Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical License Number</label>
                <input name="licenseNumber" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.licenseNumber} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input name="specialization" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.specialization} placeholder="e.g. Cardiology" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input name="qualification" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.qualification} placeholder="e.g. MBBS, MD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <input name="experience" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.experience} />
              </div>
            </div>

            {/* Clinic / Facility Details */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Facility Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital Name</label>
                  <input name="hospitalName" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.hospitalName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility Type</label>
                  <select name="facilityType" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" onChange={handleChange} value={formData.facilityType}>
                    <option value="Clinic">Clinic</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Virtual">Virtual / Telemedicine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                  <input name="consultationFee" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.consultationFee} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input name="city" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.location.city} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input name="state" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.location.state} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input name="zipCode" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.location.zipCode} />
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Verification Documents (URLs)</h3>
              <p className="text-sm text-gray-500 mb-2">Please provide links to your documents (e.g., Google Drive, Dropbox) for verification purposes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical License Certificate URL *</label>
                  <input name="docLicense" type="url" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.docLicense} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree/Qualification Proof URL *</label>
                  <input name="docDegree" type="url" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.docDegree} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Government ID Proof URL *</label>
                  <input name="docId" type="url" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.docId} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic/Hospital Registration URL</label>
                  <input name="docClinic" type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.docClinic} placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Submitting Registration...' : 'Submit Registration Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorRegister;

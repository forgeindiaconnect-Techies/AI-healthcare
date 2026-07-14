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
    registeredNumber: '',
    docClinicUrl: ''
  });

  const [files, setFiles] = useState({
    docLicenseFile: null,
    docDegreeFile: null,
    docIdFile: null,
    docClinicFile: null
  });

  const [errors, setErrors] = useState({});
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

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      const file = selectedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = '';
        return;
      }
      setFiles((prev) => ({ ...prev, [name]: file }));
    } else {
      setFiles((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    let newErrors = {};
    if (formData.phone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }
    if (!formData.specialization) {
      newErrors.specialization = "Please select a specialization.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      if (!files.docLicenseFile && !formData.docLicenseUrl) {
        setIsLoading(false);
        return toast.error("Medical License is required");
      }
      if (!files.docDegreeFile && !formData.docDegreeUrl) {
        setIsLoading(false);
        return toast.error("Degree Certificate is required");
      }
      if (!files.docIdFile && !formData.docIdUrl) {
        setIsLoading(false);
        return toast.error("Government ID is required");
      }

      const payload = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key === 'location') {
          payload.append(key, JSON.stringify(formData[key]));
        } else {
          payload.append(key, formData[key]);
        }
      });
      payload.append('role', 'doctor');

      // Append files
      if (files.docLicenseFile) payload.append('docLicenseFile', files.docLicenseFile);
      if (files.docDegreeFile) payload.append('docDegreeFile', files.docDegreeFile);
      if (files.docIdFile) payload.append('docIdFile', files.docIdFile);
      if (files.docClinicFile) payload.append('docClinicFile', files.docClinicFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        // FormData sets Content-Type automatically with boundaries
        body: payload
      });
      const data = await response.json();
      
      if (data.success || response.ok) {
        toast.success("Registration successful! Please wait for admin approval.");
        navigate('/doctor-login');
      } else {
        let errorMessage = data.error || data.message || 'Failed to register as doctor';
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
                <input 
                  name="phone" 
                  type="tel" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((prev) => ({ ...prev, phone: value }));
                    if (value.length === 10) {
                      setErrors((prev) => ({ ...prev, phone: "" }));
                    }
                  }} 
                  value={formData.phone} 
                  maxLength={10} 
                  inputMode="numeric" 
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Registered Number *</label>
                <input name="registeredNumber" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" onChange={handleChange} value={formData.registeredNumber} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select 
                  name="specialization" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" 
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value) {
                      setErrors((prev) => ({ ...prev, specialization: "" }));
                    }
                  }} 
                  value={formData.specialization}
                >
                  <option value="" disabled>Select Specialization</option>
                  <option value="General Physician">General Physician</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Orthopedic">Orthopedic</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Psychiatrist">Psychiatrist</option>
                  <option value="Dentist">Dentist</option>
                  <option value="ENT Specialist">ENT Specialist</option>
                  <option value="Ophthalmologist">Ophthalmologist</option>
                  <option value="Physiotherapist">Physiotherapist</option>
                  <option value="Surgeon">Surgeon</option>
                  <option value="Other">Other</option>
                </select>
                {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
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
              <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">Verification Documents</h3>
              <p className="text-sm text-gray-500 mb-2">Upload files (PDF/Images up to 5MB) or provide URLs for verification purposes.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Medical License Certificate *</label>
                  <input name="docLicenseFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                  <div className="flex items-center space-x-2"><hr className="flex-grow border-gray-300" /><span className="text-xs text-gray-400 font-medium">OR URL</span><hr className="flex-grow border-gray-300" /></div>
                  <input name="docLicenseUrl" type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onChange={handleChange} value={formData.docLicenseUrl} placeholder="https://..." disabled={!!files.docLicenseFile} />
                </div>
                
                <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Degree/Qualification Proof *</label>
                  <input name="docDegreeFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                  <div className="flex items-center space-x-2"><hr className="flex-grow border-gray-300" /><span className="text-xs text-gray-400 font-medium">OR URL</span><hr className="flex-grow border-gray-300" /></div>
                  <input name="docDegreeUrl" type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onChange={handleChange} value={formData.docDegreeUrl} placeholder="https://..." disabled={!!files.docDegreeFile} />
                </div>
                
                <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Government ID Proof *</label>
                  <input name="docIdFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                  <div className="flex items-center space-x-2"><hr className="flex-grow border-gray-300" /><span className="text-xs text-gray-400 font-medium">OR URL</span><hr className="flex-grow border-gray-300" /></div>
                  <input name="docIdUrl" type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onChange={handleChange} value={formData.docIdUrl} placeholder="https://..." disabled={!!files.docIdFile} />
                </div>
                
                <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Clinic/Hospital Registration Proof</label>
                  <input name="docClinicFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                  <div className="flex items-center space-x-2"><hr className="flex-grow border-gray-300" /><span className="text-xs text-gray-400 font-medium">OR URL</span><hr className="flex-grow border-gray-300" /></div>
                  <input name="docClinicUrl" type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onChange={handleChange} value={formData.docClinicUrl} placeholder="https://..." disabled={!!files.docClinicFile} />
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

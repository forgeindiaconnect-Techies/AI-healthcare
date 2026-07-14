import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Briefcase, Clock, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/api';

const DoctorProfile = () => {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    experience: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDoctorProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/doctors/profile');
      
      setFormData({
        name: response.data.fullName || "",
        email: response.data.email || "",
        specialization: response.data.specialization || "",
        experience: response.data.experience ?? ""
      });
    } catch (error) {
      console.error("Failed to load doctor profile:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Save changes to backend
      const updateData = {
        specialization: formData.specialization,
        experience: Number(formData.experience)
      };
      const response = await api.put('/api/doctors/profile', updateData);
      
      if (updateUser) {
        updateUser({ 
          name: formData.name,
          specialization: response.data.data?.specialization || formData.specialization,
          experience: response.data.data?.experience || formData.experience
        });
      }

      // Refresh profile data using the API endpoint
      await fetchDoctorProfile();
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in duration-500">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-3xl font-bold transition-transform hover:scale-105 cursor-default shadow-sm border-4 border-white">
            {formData.name ? formData.name.charAt(0) : '-'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formData.name || '--'}</h2>
            <p className="text-gray-500">{formData.email}</p>
            <span className="mt-2 inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full">
              <Check className="w-3 h-3 mr-1" /> Verified Doctor
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors" 
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  disabled 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <div className="relative">
                <Briefcase className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  name="specialization"
                  value={formData.specialization || ''}
                  onChange={handleChange}
                  placeholder="--"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors" 
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              <div className="relative">
                <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="number" 
                  name="experience"
                  value={formData.experience ?? ''}
                  onChange={handleChange}
                  min="0"
                  max="70"
                  placeholder="--"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors" 
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className={`bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Save className="w-5 h-5 mr-2" /> 
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;

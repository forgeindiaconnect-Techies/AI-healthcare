import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, MapPin, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const getStorageData = (key, fallback) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    return fallback;
  }
};

const setStorageData = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage', error);
  }
};

const PatientProfile = () => {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState(() => getStorageData("healthai_profile", {
    name: user?.name || "James Miller",
    phone: "",
    address: "123 Health Ave, NY"
  }));

  useEffect(() => {
    setStorageData("healthai_profile", profileData);
  }, [profileData]);

  const handlePhoneChange = (e) => {
    // Strictly numbers only, max length 10
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
    setProfileData({ ...profileData, phone: onlyNums });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (profileData.phone && profileData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits.');
      return;
    }
    setStorageData("healthai_profile", profileData);
    toast.success('Profile changes saved successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-3xl font-bold">
              {profileData.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
              <p className="text-gray-500">{user?.email || 'james@email.com'}</p>
              <p className="text-sm text-teal-600 font-medium mt-1">Patient ID: PAT-849201</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSave}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input type="email" value={user?.email || 'james@email.com'} disabled className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10 digit number"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
              </div>
            </div>


            
            <div className="pt-6 flex justify-end">
              <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm flex items-center transition-colors">
                <Save className="w-5 h-5 mr-2" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;

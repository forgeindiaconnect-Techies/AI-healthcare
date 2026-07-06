import React, { useState } from 'react';
import { Activity, Clock, ShieldAlert, HeartPulse, Pill, ArrowRight } from 'lucide-react';

const PreConsultationIntake = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    healthProblem: '',
    symptoms: '',
    duration: '',
    painLevel: 5,
    age: '',
    gender: '',
    allergies: '',
    currentMedicines: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert comma-separated strings to arrays
    const formattedData = {
      ...formData,
      symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
      allergies: formData.allergies.split(',').map(s => s.trim()).filter(s => s),
      currentMedicines: formData.currentMedicines.split(',').map(s => s.trim()).filter(s => s),
      painLevel: parseInt(formData.painLevel, 10),
      age: parseInt(formData.age, 10) || null
    };

    onSubmit(formattedData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        <div className="bg-indigo-600 p-8 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pre-Consultation Intake</h1>
          <p className="text-indigo-100 font-medium">Please provide some details about your condition before joining the video call. This helps your doctor prepare.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">What is your main health problem today? *</label>
              <input 
                type="text" 
                name="healthProblem" 
                required 
                value={formData.healthProblem} 
                onChange={handleChange}
                placeholder="e.g., Severe headache and nausea"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Symptoms (comma separated) *</label>
              <input 
                type="text" 
                name="symptoms" 
                required 
                value={formData.symptoms} 
                onChange={handleChange}
                placeholder="e.g., Headache, Fever, Vomiting"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1"><Clock className="w-4 h-4 inline mr-1 text-gray-400"/> Duration *</label>
                <input 
                  type="text" 
                  name="duration" 
                  required 
                  value={formData.duration} 
                  onChange={handleChange}
                  placeholder="e.g., 3 days"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1"><HeartPulse className="w-4 h-4 inline mr-1 text-gray-400"/> Pain Level (1-10) *</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    name="painLevel" 
                    min="1" 
                    max="10" 
                    value={formData.painLevel} 
                    onChange={handleChange}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="w-8 text-center font-bold text-indigo-600 bg-indigo-50 py-1 rounded-lg">{formData.painLevel}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
                <input 
                  type="number" 
                  name="age" 
                  value={formData.age} 
                  onChange={handleChange}
                  placeholder="e.g., 34"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1"><ShieldAlert className="w-4 h-4 inline mr-1 text-orange-500"/> Allergies (comma separated)</label>
              <input 
                type="text" 
                name="allergies" 
                value={formData.allergies} 
                onChange={handleChange}
                placeholder="e.g., Penicillin, Peanuts"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1"><Pill className="w-4 h-4 inline mr-1 text-blue-500"/> Current Medicines (comma separated)</label>
              <input 
                type="text" 
                name="currentMedicines" 
                value={formData.currentMedicines} 
                onChange={handleChange}
                placeholder="e.g., Paracetamol, Lisinopril"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loading ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'}`}
            >
              {loading ? 'Saving...' : 'Continue to Waiting Room'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreConsultationIntake;

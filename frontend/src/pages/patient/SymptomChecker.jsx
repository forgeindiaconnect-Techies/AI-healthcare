import React, { useState, useEffect } from 'react';
import { Search, Thermometer, Droplets, Utensils, AlertTriangle, Coffee, Sun, Moon, Info, HeartPulse, Stethoscope, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SymptomChecker = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [severity, setSeverity] = useState('Moderate');
  const [ageGroup, setAgeGroup] = useState('Adult');
  const [activeTab, setActiveTab] = useState('Recommended');
  
  const [symptomsData, setSymptomsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/symptoms', config);
        setSymptomsData(data.data || []);
      } catch (error) {
        console.error('Error fetching symptoms', error);
        toast.error('Failed to load symptoms data');
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) {
      fetchSymptoms();
    }
  }, [user?.token]);

  const filteredSymptoms = symptomsData
    .map(s => s.name)
    .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectSymptom = (symptomName) => {
    const symptom = symptomsData.find(s => s.name === symptomName);
    if (symptom) {
      setSelectedSymptom(symptom);
      setActiveTab('Recommended');
      toast.success(`Food recommendations generated for ${symptom.name}`);
    }
  };

  const activeData = selectedSymptom;

  // Compute a slight text variation for severity
  const severityPrefix = severity === 'Mild' 
    ? "As symptoms are mild, maintaining this basic diet will help." 
    : severity === 'High' 
    ? "Due to high severity, please adhere strictly to these recommendations and prioritize medical advice." 
    : "Follow these standard dietary guidelines for moderate relief.";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading symptoms data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Diet & Symptom Checker</h1>
        <p className="text-gray-500 text-sm mt-1">Get personalized food recommendations and meal plans based on your current symptoms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar - Selectors */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {['Child', 'Adult', 'Senior'].map(age => (
                    <button
                      key={age}
                      onClick={() => setAgeGroup(age)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${ageGroup === age ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {['Mild', 'Moderate', 'High'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${severity === sev ? 'bg-white text-indigo-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Symptom</h2>
            <div className="relative mb-6">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search symptoms..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              
              {/* Autocomplete Dropdown */}
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredSymptoms.length > 0 ? (
                    filteredSymptoms.map(symptom => (
                      <button
                        key={symptom}
                        onClick={() => {
                          handleSelectSymptom(symptom);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-gray-50 last:border-0"
                      >
                        {symptom}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No matching symptoms found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Buttons */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {['Fever', 'Cold', 'Cough', 'Headache', 'Stomach Pain'].map(symptom => (
                  <button
                    key={symptom}
                    onClick={() => {
                      handleSelectSymptom(symptom);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSymptom?.name === symptom ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Area - Recommendations */}
        <div className="lg:col-span-2">
          {!activeData ? (
            <div className="bg-white h-full p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Utensils className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Symptom Selected</h3>
              <p className="text-gray-500 max-w-md">Select a symptom from the left menu to view personalized dietary recommendations, foods to avoid, and a tailored meal plan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Recommendations for {selectedSymptom.name}</h2>
                  <p className="text-indigo-100 text-sm mb-2">{ageGroup} • {severity} Severity</p>
                  <p className="text-sm bg-white/10 inline-block px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">{severityPrefix}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm hidden sm:block">
                  <HeartPulse className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                  {['Recommended', 'Avoid', 'Hydration', 'Meal Plan', 'Warning'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeTab === 'Recommended' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                      {activeData.recommended.map((item, idx) => (
                        <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="text-emerald-900 font-medium text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Avoid' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in">
                      {activeData.avoid.map((item, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                          <span className="text-red-900 font-medium text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Hydration' && (
                    <div className="space-y-4 animate-in fade-in">
                      {activeData.hydration.map((item, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Droplets className="w-5 h-5 text-blue-600 shrink-0" />
                          </div>
                          <span className="text-blue-900 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Meal Plan' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200/50">
                            <Coffee className="w-5 h-5 text-amber-600" />
                            <h4 className="font-bold text-amber-900">Morning</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Morning.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-amber-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-orange-200/50">
                            <Sun className="w-5 h-5 text-orange-600" />
                            <h4 className="font-bold text-orange-900">Afternoon</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Afternoon.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-orange-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-200/50">
                            <Coffee className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-bold text-indigo-900">Evening</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Evening.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-indigo-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/50">
                            <Moon className="w-5 h-5 text-slate-600" />
                            <h4 className="font-bold text-slate-900">Night</h4>
                          </div>
                          <ul className="space-y-3">
                            {activeData.mealPlan.Night.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-slate-900 text-sm font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    </div>
                  )}

                  {activeTab === 'Warning' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                        <div className="bg-red-100 p-3 rounded-xl shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-900 mb-2 text-lg">Doctor Advice & Warnings</h4>
                          <p className="text-red-800 leading-relaxed font-medium">{activeData.warning}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                        <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
                          <Stethoscope className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-900 mb-3 text-lg">Home Care Tips</h4>
                          <ul className="space-y-2">
                            {activeData.homeCare.map((tip, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-emerald-800 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;

import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { Card, Button } from '../../components/ui/SharedUI';
import { Download, Search, Activity, Droplets, Clock, Calendar, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DiabetesDiet = () => {
  const { user } = useAuth();
  const [diseases, setDiseases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [patientDiagnoses, setPatientDiagnoses] = useState([]);
  
  // Flow chart states
  const [selectedType, setSelectedType] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  
  const [dietPlans, setDietPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const reportRef = useRef();

  const defaultQuickDiseases = ['Diabetes', 'BP', 'Fever', 'Stomach Pain', 'Headache'];
  const quickDiseases = [...new Set([...patientDiagnoses, ...defaultQuickDiseases])].slice(0, 6); // Combine patient's actual diagnoses with defaults, max 6

  const fallbackDiseases = [
    { _id: 'fallback-diabetes-id', name: 'Diabetes', category: 'Metabolic' },
    { _id: 'fallback-bp-id', name: 'BP', category: 'General' },
    { _id: 'fallback-fever-id', name: 'Fever', category: 'General' },
    { _id: 'fallback-stomach-id', name: 'Stomach Pain', category: 'General' },
    { _id: 'fallback-headache-id', name: 'Headache', category: 'General' }
  ];

  const fallbackDietPlans = [
    {
      _id: 'plan-1',
      disease: 'fallback-diabetes-id',
      diseaseType: 'Type 2',
      severity: 'Moderate',
      dailyPlan: {
        morning: ['Warm water with lemon', 'Oats / millet porridge', 'Boiled egg or sprouts', 'Low sugar fruits'],
        afternoon: ['2 Brown rice / chapati', '1 bowl Vegetables', '1 bowl Dal', 'Salad'],
        evening: ['Green tea', 'Mixed nuts', 'Roasted chana'],
        night: ['Light dinner', 'Vegetable soup', 'Green leafy vegetables']
      },
      monthlyPlan: ['Weekly diet rotation', 'Sugar monitoring reminders', 'Doctor follow-up'],
      avoidFoods: ['White Sugar', 'Sweets', 'Fried foods', 'Soft drinks'],
      warnings: ['Consult doctor before major diet change', 'Check blood sugar regularly', 'Do not skip meals']
    },
    {
      _id: 'plan-2',
      disease: 'fallback-diabetes-id',
      diseaseType: 'Type 1',
      severity: 'High',
      dailyPlan: {
        morning: ['Warm water with cinnamon', 'Protein-rich breakfast', 'Multigrain toast', 'Avocado'],
        afternoon: ['Quinoa or Bajra roti', 'Large portion of greens', 'Grilled chicken', 'Salad'],
        evening: ['Black coffee or Green tea', 'Boiled chana'],
        night: ['Clear soup', 'Grilled tofu', 'Sautéed vegetables']
      },
      monthlyPlan: ['Strict carb counting', 'Insulin dose adjustment', 'CGM tracking'],
      avoidFoods: ['All refined carbs', 'Sugary drinks', 'Trans fats'],
      warnings: ['Strict insulin timing required', 'Carry emergency glucose']
    },
    {
      _id: 'plan-fever-1',
      disease: 'fallback-fever-id',
      diseaseType: 'Viral/Bacterial',
      severity: 'Standard',
      dailyPlan: {
        morning: ['Warm ginger tea', 'Soft boiled egg or porridge', 'Fresh orange juice'],
        afternoon: ['Clear chicken or vegetable soup', 'Soft cooked rice (Khichdi)', 'Boiled carrots'],
        evening: ['Warm herbal tea', 'A few biscuits'],
        night: ['Light soup', 'Mashed potatoes or soft rice']
      },
      monthlyPlan: ['Rest completely until fever subsides', 'Gradually return to normal diet'],
      avoidFoods: ['Spicy foods', 'Deep fried foods', 'Heavy dairy products', 'Caffeine'],
      warnings: ['If fever > 103°F seek medical help', 'Stay extremely hydrated']
    },
    {
      _id: 'plan-bp-1',
      disease: 'fallback-bp-id',
      diseaseType: 'Hypertension',
      severity: 'High',
      dailyPlan: {
        morning: ['Celery juice or warm lemon water', 'Oatmeal with chia seeds', 'Banana'],
        afternoon: ['Grilled chicken or tofu salad', 'Quinoa', 'Steamed broccoli'],
        evening: ['Green tea', 'Handful of unsalted almonds'],
        night: ['Light vegetable soup', '1 piece of grilled fish or paneer', 'Small portion of brown rice']
      },
      monthlyPlan: ['Check BP daily', 'Limit sodium strictly', '30 mins brisk walk daily'],
      avoidFoods: ['Salt/High sodium foods', 'Processed meats', 'Pickles', 'Canned soups'],
      warnings: ['If BP > 180/120 seek emergency care immediately', 'Do not skip medication']
    },
    {
      _id: 'plan-stomach-1',
      disease: 'fallback-stomach-id',
      diseaseType: 'Gastritis',
      severity: 'Standard',
      dailyPlan: {
        morning: ['Cold milk or coconut water', 'Oatmeal', 'Banana'],
        afternoon: ['Plain yogurt with rice', 'Steamed vegetables', 'Non-spicy lentils'],
        evening: ['Chamomile tea', 'Plain crackers'],
        night: ['Light lentil soup', 'Soft rice or plain toast']
      },
      monthlyPlan: ['Eat smaller, frequent meals', 'Avoid lying down immediately after eating'],
      avoidFoods: ['Spicy curries', 'Citrus fruits', 'Coffee/Tea', 'Tomato based sauces', 'Fried foods'],
      warnings: ['If pain is severe and sudden, seek emergency care', 'Watch for dark stools']
    },
    {
      _id: 'plan-headache-1',
      disease: 'fallback-headache-id',
      diseaseType: 'Migraine',
      severity: 'Standard',
      dailyPlan: {
        morning: ['Water with magnesium powder', 'Scrambled eggs', 'Whole wheat toast'],
        afternoon: ['Salmon or leafy green salad', 'Quinoa', 'Avocado'],
        evening: ['Ginger tea', 'Handful of almonds or pumpkin seeds'],
        night: ['Grilled chicken or tofu', 'Spinach', 'Sweet potato']
      },
      monthlyPlan: ['Identify and track food triggers', 'Maintain consistent sleep schedule', 'Stay hydrated'],
      avoidFoods: ['Aged cheeses', 'Processed meats (Nitrates)', 'Artificial sweeteners', 'Alcohol (Red wine)'],
      warnings: ['If headache is "worst of your life", seek emergency care', 'Monitor vision changes']
    }
  ];

  const fetchDiseases = async (query = '') => {
    try {
      const res = await API.get(`/api/diet/diseases${query ? `?q=${query}` : ''}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data.success) {
        setDiseases(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching diseases:', error);
    }
  };

  const fetchMyDiagnoses = async () => {
    try {
      const { data } = await API.get('/api/medical/my-diagnoses', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (data.success && data.data) {
        const uniqueDiagnoses = [...new Set(data.data.map(d => d.primaryDiagnosis))];
        setPatientDiagnoses(uniqueDiagnoses);
      }
    } catch (err) {
      console.error("Failed to fetch medical history:", err);
    }
  };

  const fetchDietPlans = async (diseaseId) => {
    setIsLoading(true);
    try {
      const res = await API.get(`/api/diet/plans/${diseaseId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data.success && res.data.data.length > 0) {
        setDietPlans(res.data.data);
      } else {
        const plans = fallbackDietPlans.filter(p => p.disease === diseaseId);
        setDietPlans(plans);
      }
    } catch (error) {
      console.error('Error fetching diet plans:', error);
      const plans = fallbackDietPlans.filter(p => p.disease === diseaseId);
      setDietPlans(plans);
      if (plans.length === 0) {
        toast.error('Failed to load diet plans');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
    fetchMyDiagnoses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedDisease) {
      fetchDietPlans(selectedDisease._id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisease]);

  const availableTypes = [...new Set(dietPlans.map(p => p.diseaseType))];
  const availableSeverities = selectedType 
    ? [...new Set(dietPlans.filter(p => p.diseaseType === selectedType).map(p => p.severity))]
    : [];

  useEffect(() => {
    if (availableTypes.length === 1 && !selectedType) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, selectedType]);

  useEffect(() => {
    if (availableSeverities.length === 1 && !selectedSeverity) {
      setSelectedSeverity(availableSeverities[0]);
    }
  }, [availableSeverities, selectedSeverity]);

  useEffect(() => {
    if (dietPlans.length > 0 && selectedType && selectedSeverity) {
      // Find the best matching plan
      const plan = dietPlans.find(p => p.diseaseType === selectedType && p.severity === selectedSeverity);
      if (plan) {
        setActivePlan(plan);
      } else {
        // Fallback to first plan if exact match not found
        setActivePlan(dietPlans[0]);
      }
    } else if (dietPlans.length > 0 && !selectedType && !selectedSeverity) {
       // Reset active plan if type/severity not fully selected
       setActivePlan(null);
    }
  }, [selectedType, selectedSeverity, dietPlans]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    fetchDiseases(e.target.value);
  };

  const handleDiseaseSelect = (diseaseName) => {
    let disease = diseases.find(d => d.name.toLowerCase() === diseaseName.toLowerCase());
    if (!disease) {
      disease = fallbackDiseases.find(d => d.name.toLowerCase() === diseaseName.toLowerCase());
    }

    if (disease) {
      setSelectedDisease(disease);
      setSelectedType(null);
      setSelectedSeverity(null);
      setActivePlan(null);
      toast.success(`${disease.name} selected`);
    } else {
      toast.error('Diet plan for this disease is not available yet.');
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current || !activePlan) return;
    
    setGeneratingPdf(true);
    toast.loading('Generating Diet Report PDF...', { id: 'pdf' });
    
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Diet_Report_${user.name.replace(/\s+/g, '_')}.pdf`);
      
      // Save report to backend
      await API.post(`/api/diet/reports`, {
        disease: selectedDisease._id,
        dietPlan: activePlan._id,
        patientName: user.name,
        diseaseName: selectedDisease.name,
        diseaseType: activePlan.diseaseType,
        severity: activePlan.severity,
        reportData: {
          morning: activePlan.dailyPlan.morning,
          afternoon: activePlan.dailyPlan.afternoon,
          evening: activePlan.dailyPlan.evening,
          night: activePlan.dailyPlan.night,
          monthlyPlan: activePlan.monthlyPlan,
          avoidFoods: activePlan.avoidFoods,
          warnings: activePlan.warnings,
        }
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      toast.success('Report generated and saved!', { id: 'pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report', { id: 'pdf' });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const renderFlowChart = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
      <h3 className="text-lg font-bold mb-6 text-center text-gray-800">Diet Plan Flow Chart</h3>
      <div className="flex flex-col items-center min-w-[600px]">
        {/* Step 1 */}
        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md">
          {selectedDisease ? selectedDisease.name : 'Select Disease'}
        </div>
        <div className="h-8 w-1 bg-blue-300 my-1"></div>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-300 mb-2"></div>
        
        {/* Step 2: Select Type */}
        {availableTypes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setSelectedSeverity(null); }}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${selectedType === type ? 'border-blue-500 bg-blue-50 font-bold text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
        
        {selectedType && availableSeverities.length > 0 && (
          <>
            <div className="h-8 w-1 bg-blue-300 my-1"></div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-300 mb-2"></div>
            
            {/* Step 3: Select Severity */}
            <div className="flex flex-wrap justify-center gap-4 mb-2">
              {availableSeverities.map(severity => (
                <button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedSeverity === severity 
                      ? severity === 'High' ? 'border-red-500 bg-red-50 text-red-700 font-bold' 
                        : severity === 'Moderate' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                        : severity === 'Low' || severity === 'Mild' ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                        : 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </>
        )}
        
        {selectedSeverity && (
          <>
            <div className="h-8 w-1 bg-green-500 my-1"></div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-green-500 mb-2"></div>
            
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md flex items-center gap-2">
              <CheckCircle size={18} />
              Diet Plan Ready
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">🍽️</span> Diet Flow Chart
          </h1>
          <p className="text-gray-500 mt-2">Personalized nutrition plans based on your health conditions</p>
        </div>
        
        {activePlan && (
          <Button 
            onClick={generatePDF} 
            disabled={generatingPdf}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} />
            {generatingPdf ? 'Generating...' : 'Generate Diet Report'}
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { title: "Today's Meals", value: "4/5", icon: <Activity size={20} color="#3B82F6" />, bg: "bg-blue-50" },
          { title: "Water Intake", value: "1.5L / 3L", icon: <Droplets size={20} color="#06B6D4" />, bg: "bg-cyan-50" },
          { title: "Sugar Check", value: "2 Hrs After", icon: <Clock size={20} color="#F59E0B" />, bg: "bg-yellow-50" },
          { title: "Monthly Follow-up", value: "In 12 Days", icon: <Calendar size={20} color="#8B5CF6" />, bg: "bg-purple-50" },
          { title: "Diet Compliance", value: "85%", icon: <CheckCircle size={20} color="#10B981" />, bg: "bg-green-50" }
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-xl border border-gray-100 flex flex-col justify-between ${kpi.bg}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-600 font-medium">{kpi.title}</span>
              {kpi.icon}
            </div>
            <span className="text-2xl font-bold text-gray-800">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Selection */}
        <div className="lg:col-span-4">
          <Card>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">1. Select Condition</h3>
            
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search disease..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            <div className="mb-6">
              <h4 className="text-sm text-gray-500 font-semibold mb-3">Quick Select:</h4>
              <div className="flex flex-wrap gap-2">
                {quickDiseases.map(d => (
                  <button
                    key={d}
                    onClick={() => handleDiseaseSelect(d)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedDisease?.name === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedDisease && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <h4 className="font-bold text-blue-900">{selectedDisease.name}</h4>
                </div>
                <p className="text-sm text-blue-800 mb-2">{selectedDisease.description}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDisease.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-white text-blue-600 px-2 py-0.5 rounded-md border border-blue-200">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Area: Flow Chart & Plan */}
        <div className="lg:col-span-8">
          {renderFlowChart()}

          {isLoading ? (
            <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
          ) : activePlan ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" ref={reportRef}>
              {/* Report Header (Visible mainly for PDF export) */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">Personalized Diet Plan</h2>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {activePlan.diseaseType} - {activePlan.severity} Severity
                  </span>
                </div>
                <p className="opacity-90">Patient: {user?.name} | Condition: {selectedDisease.name} | Date: {new Date().toLocaleDateString()}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
                {['daily', 'monthly', 'avoid', 'warnings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab === 'daily' ? 'Daily Plan' : tab === 'monthly' ? 'Monthly Plan' : tab === 'avoid' ? 'Avoid Foods' : 'Warnings'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'daily' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['morning', 'afternoon', 'evening', 'night'].map((time) => (
                      <div key={time} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-800 capitalize mb-3 flex items-center gap-2">
                          {time === 'morning' ? '🌅' : time === 'afternoon' ? '☀️' : time === 'evening' ? '🌆' : '🌙'} {time}
                        </h4>
                        <ul className="space-y-2">
                          {activePlan.dailyPlan[time]?.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'monthly' && (
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">📅 Monthly Milestones & Routine</h4>
                    <ul className="space-y-3">
                      {activePlan.monthlyPlan?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-purple-800 bg-white p-3 rounded-lg shadow-sm">
                          <CheckCircle size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'avoid' && (
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">🚫 Strictly Avoid These Foods</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {activePlan.avoidFoods?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-red-800 bg-white p-2 rounded shadow-sm border border-red-50">
                          <span className="text-red-500 font-bold">✕</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'warnings' && (
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                    <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2">⚠️ Important Health Warnings</h4>
                    <ul className="space-y-4">
                      {activePlan.warnings?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-orange-800 border-l-4 border-orange-400 pl-4 py-1">
                          <span className="font-semibold">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : selectedType && selectedSeverity ? (
             <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500">
               No specific diet plan found for this combination. Please contact your doctor.
             </div>
          ) : dietPlans.length === 0 && selectedDisease ? (
             <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500 flex flex-col items-center gap-2">
               <Activity className="w-8 h-8 text-gray-400 mb-2" />
               <p className="font-bold text-gray-700">No Diet Plan Available</p>
               <p>We couldn't find a diet plan for {selectedDisease.name}. Please contact your doctor for a personalized plan.</p>
             </div>
          ) : (
             <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500 flex flex-col items-center gap-2">
               <Calendar className="w-8 h-8 text-gray-400 mb-2" />
               <p>Please complete the flow chart selection above to view your personalized diet plan.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiabetesDiet;

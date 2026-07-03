import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge } from '../../components/ui/SharedUI';
import { Download, Search, Activity, Droplets, Clock, Calendar, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DiabetesDiet = () => {
  const { user } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Quick selects
  const quickDiseases = ['Diabetes', 'BP', 'Fever', 'Stomach Pain', 'Headache'];
  
  // Result state
  const [activePlan, setActivePlan] = useState(null);
  
  // Flow chart step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const reportRef = useRef();

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      analyzeCondition(searchQuery.trim());
    }
  };

  const handleQuickSelect = (condition) => {
    setSearchQuery(condition);
    analyzeCondition(condition);
  };

  const analyzeCondition = async (condition) => {
    if (!condition) {
      toast.error('Please enter a health condition.');
      return;
    }
    
    setIsAnalyzing(true);
    setCurrentStep(2); // Analyzing patient details
    setActivePlan(null);
    
    // Simulate flow chart steps for better UX
    setTimeout(() => setCurrentStep(3), 1000); // Generate diet plan

    try {
      const res = await API.post('/api/diet/analyze', { condition }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      if (res.data.success && res.data.data) {
        setCurrentStep(4); // Show food recommendations
        setTimeout(() => {
          setActivePlan(res.data.data);
          setCurrentStep(5); // Follow-up reminder
          toast.success('Diet plan generated successfully!');
        }, 800);
      } else {
        throw new Error(res.data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing condition:', error);
      toast.error('Unable to generate diet plan. Please try again.');
      setCurrentStep(1);
    } finally {
      setIsAnalyzing(false);
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
      pdf.save(`Diet_Plan_${activePlan.condition.replace(/\s+/g, '_')}.pdf`);
      
      toast.success('Report generated and downloaded!', { id: 'pdf' });
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
      <div className="flex justify-between items-center min-w-[600px] relative">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        
        {/* Step 1 */}
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white z-10 ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>1</div>
          <span className={`mt-2 text-sm font-semibold ${currentStep >= 1 ? 'text-blue-800' : 'text-gray-500'}`}>Select Disease</span>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white z-10 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}>2</div>
          <span className={`mt-2 text-sm font-semibold ${currentStep >= 2 ? 'text-blue-800' : 'text-gray-500'}`}>Analyze Details</span>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white z-10 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}>3</div>
          <span className={`mt-2 text-sm font-semibold ${currentStep >= 3 ? 'text-blue-800' : 'text-gray-500'}`}>Generate Plan</span>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white z-10 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`}>4</div>
          <span className={`mt-2 text-sm font-semibold ${currentStep >= 4 ? 'text-blue-800' : 'text-gray-500'}`}>Recommendations</span>
        </div>

        {/* Step 5 */}
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white z-10 ${currentStep >= 5 ? 'bg-green-500' : 'bg-gray-300'}`}>
            {currentStep >= 5 ? <CheckCircle size={20} /> : '5'}
          </div>
          <span className={`mt-2 text-sm font-semibold ${currentStep >= 5 ? 'text-green-600' : 'text-gray-500'}`}>Complete</span>
        </div>
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
          <p className="text-gray-500 mt-2">Personalized AI nutrition plans based on your health conditions</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Today's Meals", value: "4/5", icon: <Activity size={20} color="#3B82F6" />, bg: "bg-blue-50" },
          { title: "Water Intake", value: activePlan?.waterIntake || "1.5L / 3L", icon: <Droplets size={20} color="#06B6D4" />, bg: "bg-cyan-50" },
          { title: "Reminder", value: activePlan?.monitoring || "Check Vitals", icon: <Clock size={20} color="#F59E0B" />, bg: "bg-yellow-50" },
          { title: "Diet Compliance", value: "85%", icon: <CheckCircle size={20} color="#10B981" />, bg: "bg-green-50" }
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-xl border border-gray-100 flex flex-col justify-between ${kpi.bg}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-600 font-medium">{kpi.title}</span>
              {kpi.icon}
            </div>
            <span className="text-xl font-bold text-gray-800 line-clamp-1">{kpi.value}</span>
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
                placeholder="Search disease (e.g. Diabetes, BP, Fever)..."
                value={searchQuery}
                onChange={handleSearch}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              
              <button 
                onClick={() => analyzeCondition(searchQuery)}
                disabled={isAnalyzing || !searchQuery.trim()}
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex justify-center items-center gap-2"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" size={18} /> : 'Analyze & Generate Plan'}
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm text-gray-500 font-semibold mb-3">Quick Select:</h4>
              <div className="flex flex-wrap gap-2">
                {quickDiseases.map(d => (
                  <button
                    key={d}
                    onClick={() => handleQuickSelect(d)}
                    disabled={isAnalyzing}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${searchQuery.toLowerCase() === d.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3 mt-8">
              <AlertCircle className="text-orange-500 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-xs text-orange-800 leading-relaxed">
                <strong>Disclaimer:</strong> This diet plan is AI-assisted and for general guidance. Please follow your doctor's advice for final treatment.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Area: Flow Chart & Plan */}
        <div className="lg:col-span-8">
          {renderFlowChart()}

          {isAnalyzing ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Activity size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Analyzing your health condition...</h3>
              <p className="text-gray-500 max-w-md text-center">Our AI is reviewing your profile and generating a personalized diet strategy based on medical best practices.</p>
            </div>
          ) : activePlan ? (
            <div className="space-y-6" ref={reportRef}>
              
              {/* Urgent Warning (if serious condition) */}
              {activePlan.riskLevel === 'HIGH' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <h4 className="font-bold text-red-900">High Risk Condition Detected</h4>
                    <p className="text-red-700 text-sm mt-1">Please contact a doctor or emergency service immediately. This diet plan is only for supplementary care.</p>
                  </div>
                </div>
              )}

              {/* Condition Summary Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{activePlan.condition} Diet Plan</h2>
                    <p className="opacity-90 max-w-xl">{activePlan.summary}</p>
                  </div>
                  <Badge 
                    variant={activePlan.riskLevel === 'LOW' ? 'success' : activePlan.riskLevel === 'MEDIUM' ? 'warning' : 'danger'}
                    className="px-3 py-1 text-sm shadow-sm"
                  >
                    {activePlan.riskLevel} RISK
                  </Badge>
                </div>
              </div>

              {/* Foods: Eat & Avoid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                  <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} /> Recommended Foods
                  </h4>
                  <ul className="space-y-3">
                    {activePlan.recommendedFoods?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-800 bg-white p-2.5 rounded-lg shadow-sm border border-green-50">
                        <span className="text-green-500 font-bold mt-0.5">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                  <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} /> Foods to Avoid
                  </h4>
                  <ul className="space-y-3">
                    {activePlan.avoidFoods?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-red-800 bg-white p-2.5 rounded-lg shadow-sm border border-red-50">
                        <span className="text-red-500 font-bold mt-0.5">✕</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Daily Schedule */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Calendar className="text-blue-500" size={20} /> Daily Meal Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => (
                    <div key={mealType} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-gray-800 capitalize mb-3 flex items-center gap-2">
                        {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'dinner' ? '🌙' : '🍎'} {mealType}
                      </h4>
                      <ul className="space-y-2">
                        {activePlan[mealType]?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-blue-500 mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifestyle & Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 shadow-sm">
                  <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <Activity size={20} /> Lifestyle Tips
                  </h4>
                  <ul className="space-y-3">
                    {activePlan.lifestyleTips?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-purple-800">
                        <span className="text-purple-500 mt-0.5">✦</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm">
                  <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} /> Warning Signs to Watch
                  </h4>
                  <ul className="space-y-3">
                    {activePlan.warningSigns?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-orange-800 font-medium">
                        <span className="text-orange-500 mt-0.5">⚠️</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 text-gray-400 text-xs text-center py-4 rounded-lg">
                Generated by HealthAI on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>

            </div>
          ) : (
             <div className="bg-gray-50 p-12 rounded-xl border border-gray-200 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
               <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                 <Search className="w-10 h-10 text-blue-400" />
               </div>
               <h3 className="text-xl font-bold text-gray-700 mb-2">Ready to generate your plan</h3>
               <p className="max-w-md">Enter a health condition in the search box or click a quick select button to generate a personalized diet plan using our AI nutritionist.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiabetesDiet;

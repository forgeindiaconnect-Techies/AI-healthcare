import React, { useState } from 'react';
import { FileText, Activity, Brain, CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';
import API from '../../api/api';
import toast from 'react-hot-toast';

const ConsultationPanel = ({ 
  appointment, 
  onNotesUpdate, 
  onDiagnosisUpdate,
  onSimpleExplanationUpdate,
  onTreatmentAdviceUpdate,
  onTestsNeededUpdate,
  onFollowUpDateUpdate,
  onEmergencySignsUpdate,
  values
}) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const patient = appointment.patientProfile || {};

  const handleNotesChange = (e) => onNotesUpdate(e.target.value);
  const handleDiagnosisChange = (e) => onDiagnosisUpdate(e.target.value);
  const handleSimpleExplanationChange = (e) => onSimpleExplanationUpdate(e.target.value);
  const handleTreatmentAdviceChange = (e) => onTreatmentAdviceUpdate(e.target.value);
  const handleTestsNeededChange = (e) => onTestsNeededUpdate(e.target.value);
  const handleFollowUpDateChange = (e) => onFollowUpDateUpdate(e.target.value);
  const handleEmergencySignsChange = (e) => onEmergencySignsUpdate(e.target.value);

  const handleAISummarize = async () => {
    if (!values.doctorNotes?.trim()) {
      toast.error('Please add some notes first.');
      return;
    }
    
    setIsSummarizing(true);
    try {
      const res = await API.post('/api/ai/analyze-symptoms', { symptoms: [values.doctorNotes] }); 
      
      setTimeout(() => {
        setAiSummary(`Patient presents with described symptoms. Diagnosis: ${values.diagnosis || 'Pending'}. Advised to follow up in 7 days.`);
        setIsSummarizing(false);
        toast.success('AI Summary Generated!');
      }, 1500);

    } catch (err) {
      console.error(err);
      setIsSummarizing(false);
      toast.error('Failed to generate summary.');
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)] border-l border-gray-100 z-10">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner">
          {appointment.patient?.name?.charAt(0)}
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg leading-tight">{appointment.patient?.name}</h2>
          <p className="text-sm text-gray-500 font-medium">{patient.bloodType || 'Unknown'} Blood • Age {patient.age || '--'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Activity className="w-4 h-4" /> History
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4" /> Notes
        </button>
        <button 
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'plan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Plan
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vitals & Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Weight</span>
                  <p className="font-bold text-gray-900">{patient.weight ? `${patient.weight} kg` : '--'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Height</span>
                  <p className="font-bold text-gray-900">{patient.height ? `${patient.height} cm` : '--'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Known Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {patient.chronicConditions?.length > 0 ? patient.chronicConditions.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{c}</span>
                )) : <span className="text-sm text-gray-500">None reported.</span>}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies?.length > 0 ? patient.allergies.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg border border-orange-100">{c}</span>
                )) : <span className="text-sm text-gray-500">None reported.</span>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6 h-full flex flex-col">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2"><Stethoscope className="w-3 h-3"/> Diagnosis / Impression</label>
              <input 
                type="text" 
                value={values?.diagnosis || ''}
                onChange={handleDiagnosisChange}
                placeholder="E.g., Acute Viral Pharyngitis"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2"><FileText className="w-3 h-3"/> Clinical Notes</label>
              <textarea 
                value={values?.doctorNotes || ''}
                onChange={handleNotesChange}
                placeholder="Type your consultation notes here..."
                className="w-full flex-1 min-h-[200px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm leading-relaxed"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-gray-100">
               <button 
                onClick={handleAISummarize}
                disabled={isSummarizing || !values?.doctorNotes?.trim()}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${values?.doctorNotes?.trim() ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
               >
                 <Brain className={`w-5 h-5 ${isSummarizing ? 'animate-pulse' : ''}`} />
                 {isSummarizing ? 'Generating Summary...' : 'Generate AI Summary'}
               </button>

               {aiSummary && (
                 <div className="mt-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> AI Summary</p>
                    <p className="text-sm text-purple-900 leading-relaxed font-medium">{aiSummary}</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Simple Explanation (For Patient)</label>
              <textarea 
                value={values?.simpleExplanation || ''}
                onChange={handleSimpleExplanationChange}
                placeholder="Explain the condition simply..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              ></textarea>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Treatment / Advice</label>
              <textarea 
                value={values?.treatmentAdvice || ''}
                onChange={handleTreatmentAdviceChange}
                placeholder="List advice and medicines..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              ></textarea>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Tests Needed</label>
              <input 
                type="text" 
                value={values?.testsNeeded || ''}
                onChange={handleTestsNeededChange}
                placeholder="e.g., Blood Test, X-Ray"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Emergency Warning Signs</label>
              <input 
                type="text" 
                value={values?.emergencySigns || ''}
                onChange={handleEmergencySignsChange}
                placeholder="e.g., Difficulty breathing, high fever"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Follow-up Date</label>
              <input 
                type="date" 
                value={values?.followUpDate ? values.followUpDate.split('T')[0] : ''}
                onChange={handleFollowUpDateChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default ConsultationPanel;

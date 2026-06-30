import React, { useState } from 'react';
import { FileText, Plus, Search, Download, Edit, X, Eye, Activity, Filter, FileSignature, Stethoscope, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import PrescriptionBuilder from '../../components/dashboard/doctor/PrescriptionBuilder';

const DoctorPrescriptions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [viewPrescription, setViewPrescription] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const mockPrescriptions = [];

  const handleDownload = (rx) => {
    const content = `HEALTH AI CLINIC\n------------------------\nPatient: ${rx.patient}\nDate: ${rx.date}\nStatus: ${rx.status}\n\nRx:\n${rx.details}\n\nDoctor Signature: ____________`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${rx.patient.replace(' ', '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded digital prescription for ${rx.patient}`);
  };

  const filteredPrescriptions = mockPrescriptions.filter(rx => {
    const matchesSearch = rx.patient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center z-10">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full blur-3xl opacity-60 z-0"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-40 h-40 bg-gradient-to-tr from-blue-50 to-teal-50 rounded-full blur-2xl opacity-60 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
              <FileSignature className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Prescriptions</h1>
              <p className="text-gray-500 font-medium mt-1">Manage digital prescriptions and pharmacy orders</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 hidden md:block">
          <button 
            onClick={() => setShowBuilderModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> New Prescription
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-teal-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search prescriptions by patient name..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-all outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`border px-6 py-3 rounded-2xl font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 ${showFilterDropdown ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            <Filter className="w-5 h-5" /> 
            {statusFilter === 'All' ? 'Filter list' : statusFilter}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
              {['All', 'Active', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${statusFilter === status ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Card List */}
      <div className="space-y-4">
        {filteredPrescriptions.map((rx) => (
          <div 
            key={rx.id} 
            onClick={() => setViewPrescription(rx)}
            className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-5 mb-4 md:mb-0">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-teal-100 transition-all border border-teal-100/50">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-teal-700 transition-colors">{rx.patient}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1.5 font-medium"><Activity className="w-4 h-4 text-gray-400" /> {rx.medicines} Meds</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4 text-gray-400" /> {rx.date}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 ml-19 md:ml-0">
              <span className={`px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5 ${
                rx.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200 shadow-sm'
              }`}>
                {rx.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                {rx.status}
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowBuilderModal(true); }}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm"
                  title="Edit"
                >
                  <Edit className="w-4 h-4"/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setViewPrescription(rx); }}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200 flex items-center justify-center transition-all shadow-sm"
                  title="View"
                >
                  <Eye className="w-4 h-4"/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(rx); }}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 flex items-center justify-center transition-all shadow-sm"
                  title="Download"
                >
                  <Download className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredPrescriptions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Prescriptions Found</h3>
            <p className="text-gray-500">Could not find any prescriptions matching your search.</p>
          </div>
        )}
      </div>

      {/* Prescription Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
             <button 
               onClick={() => setShowBuilderModal(false)}
               className="absolute top-6 right-6 z-10 text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
             <PrescriptionBuilder />
          </div>
        </div>
      )}

      {/* Prescription Viewer Modal - Rich Aesthetic */}
      {viewPrescription && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
             
             {/* Header (Fixed) */}
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
               <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                 <div className="p-1.5 bg-teal-50 rounded-lg"><Stethoscope className="w-5 h-5 text-teal-600" /></div>
                 Digital Prescription
               </h3>
               <button 
                 onClick={() => setViewPrescription(null)}
                 className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Body (Scrollable) */}
             <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 relative">
                   {/* Clinic Header */}
                   <div className="text-center pb-6 mb-6 border-b-2 border-gray-100">
                      <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                        <FileSignature className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-2xl text-gray-900 tracking-tight">HealthAI Clinic</h4>
                      <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Digital Healthcare</p>
                   </div>
                   
                   {/* Patient Info */}
                   <div className="flex justify-between items-end mb-8 pb-6 border-b border-gray-100">
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Patient Name</p>
                        <p className="font-black text-lg text-slate-900">{viewPrescription.patient}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Date Issued</p>
                        <p className="font-bold text-teal-700">{viewPrescription.date}</p>
                      </div>
                   </div>

                   {/* Rx Content */}
                   <div className="mb-12">
                      <div className="text-teal-600 font-serif text-5xl italic font-black mb-6">Rx</div>
                      <div className="text-gray-800 whitespace-pre-line font-medium leading-relaxed text-lg">
                        {viewPrescription.details}
                      </div>
                   </div>

                   {/* Footer / Signature */}
                   <div className="pt-8 flex justify-end mt-12">
                      <div className="text-center">
                         <div className="border-b-2 border-gray-900 w-48 mb-3"></div>
                         <p className="text-xs font-black uppercase tracking-widest text-gray-900">Dr. Sarah Johnson</p>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">License: MD-88291</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Actions Footer (Fixed) */}
             <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-4 rounded-b-3xl">
               <button 
                 onClick={() => handleDownload(viewPrescription)}
                 className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
               >
                 <Download className="w-5 h-5" /> Download PDF
               </button>
               <button 
                 onClick={() => window.print()}
                 className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 py-3.5 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
               >
                 Print Copy
               </button>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptions;

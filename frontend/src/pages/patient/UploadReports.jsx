import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { UploadCloud, FileText, CheckCircle, XCircle, File as FileIcon, Calendar, Activity, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UploadReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    reportType: 'lab',
    reportDate: new Date().toISOString().split('T')[0],
    labName: '',
    description: ''
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    setFile(selectedFile);
    // Auto-fill title if empty
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: selectedFile.name.split('.')[0] }));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!formData.title || !formData.reportType || !formData.reportDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('title', formData.title);
      data.append('reportType', formData.reportType);
      data.append('reportDate', formData.reportDate);
      if (formData.labName) data.append('labName', formData.labName);
      if (formData.description) data.append('description', formData.description);

      const config = { 
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };
      
      await API.post('/api/reports/upload', data, config);
      toast.success('Report uploaded successfully!');
      
      // Reset form or redirect
      setTimeout(() => {
        navigate('/dashboard/medical-reports');
      }, 1500);

    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload report');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileText className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <UploadCloud className="w-3 h-3" /> Secure Upload
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Upload Medical Reports</h1>
          <p className="text-teal-100 text-lg opacity-90 leading-relaxed">
            Digitize your medical history. Upload lab results, scans, and prescriptions to make them easily accessible to your doctors.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Drag & Drop */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-teal-600" /> Select Document
              </h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {!file ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer bg-gray-50 ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300 hover:bg-gray-100'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-teal-100 text-teal-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 mb-1">Click or drag file to this area</h3>
                  <p className="text-xs text-gray-500 mb-4">Support for a single PDF, JPG, or PNG upload.</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Max size 5MB</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="application/pdf,image/jpeg,image/png,image/jpg" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 text-center relative">
                    <button 
                      type="button" 
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 text-teal-400 hover:text-teal-600 bg-white rounded-full p-1 shadow-sm transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-teal-100 text-teal-600">
                      {file.type === 'application/pdf' ? <FileText className="w-8 h-8" /> : <FileIcon className="w-8 h-8" />}
                    </div>
                    <p className="font-bold text-teal-900 text-sm truncate px-4" title={file.name}>{file.name}</p>
                    <p className="text-xs text-teal-600 font-medium mt-1">{formatFileSize(file.size)}</p>
                    
                    <div className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-teal-700 bg-white/60 py-1.5 px-3 rounded-full mx-auto w-max">
                      <CheckCircle className="w-3.5 h-3.5" /> Ready to upload
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-teal-600" /> Document Details
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Document Title *</label>
                  <input 
                    type="text" required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Complete Blood Count"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-500" /> Report Type *
                  </label>
                  <select 
                    required
                    value={formData.reportType}
                    onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  >
                    <option value="lab">Laboratory Result</option>
                    <option value="prescription">Prescription</option>
                    <option value="mri">MRI Scan</option>
                    <option value="xray">X-Ray</option>
                    <option value="ct-scan">CT Scan</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="ecg">ECG</option>
                    <option value="discharge">Discharge Summary</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-500" /> Date of Report *
                  </label>
                  <input 
                    type="date" required
                    value={formData.reportDate}
                    onChange={(e) => setFormData({...formData, reportDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Clinic / Lab Name (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.labName}
                    onChange={(e) => setFormData({...formData, labName: e.target.value})}
                    placeholder="e.g. City Diagnostic Center"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-medium bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Brief Description (Optional)</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Any additional notes about this document..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-sm font-medium bg-gray-50 resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={isUploading || !file}
                  className={`px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isUploading || !file 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 hover:-translate-y-0.5'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Uploading to Secure Cloud...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" /> Save Medical Report
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UploadReports;

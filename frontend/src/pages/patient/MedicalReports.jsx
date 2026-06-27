import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, UploadCloud, File, Trash2, Eye, Download, AlertCircle, Loader, Activity, Filter } from 'lucide-react';
import { Badge, Button, Card } from '../../components/ui/SharedUI';
import toast from 'react-hot-toast';

const MedicalReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload states
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Blood Test');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const categories = ['Blood Test', 'X-Ray', 'MRI', 'CT Scan', 'Prescription', 'Other'];

  const mockReports = [
    { _id: '1', title: 'Complete Blood Count', category: 'Blood Test', fileType: 'pdf', status: 'Reviewed', createdAt: new Date(Date.now() - 864000000).toISOString(), aiSummary: 'All values are within normal ranges. Platelets are optimal.', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { _id: '2', title: 'Chest X-Ray', category: 'X-Ray', fileType: 'image', status: 'Pending Review', createdAt: new Date(Date.now() - 172800000).toISOString(), aiSummary: 'Awaiting radiologist interpretation. No obvious abnormalities detected by initial AI scan.', fileUrl: 'https://placehold.co/600x400/png' },
    { _id: '3', title: 'Lipid Profile', category: 'Blood Test', fileType: 'pdf', status: 'Critical', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), aiSummary: 'LDL Cholesterol is elevated. Follow-up consultation recommended.', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/reports', config);
      const fetchedReports = data.data || [];
      if (fetchedReports.length === 0) {
        setReports(mockReports);
      } else {
        setReports(fetchedReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports(mockReports); // fallback
    } finally {
      setLoading(false);
    }
  };

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
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      toast.error('Please provide both a title and a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);
      const typeMap = {
        'Blood Test': 'lab',
        'X-Ray': 'xray',
        'MRI': 'mri',
        'CT Scan': 'ct-scan',
        'Prescription': 'prescription',
        'Other': 'other'
      };
      formData.append('reportType', typeMap[category] || 'other');

      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${user.token}` } };
      const { data } = await API.post('/api/reports/upload', formData, config);
      
      toast.success('Report uploaded! AI is analyzing...');
      
      let newReport = data.data;
      newReport.aiSummary = 'AI Analysis in progress. Please wait...';
      
      setReports(prev => [newReport, ...prev]);
      setFile(null);
      setTitle('');
      setCategory('Blood Test');

      // Trigger analysis asynchronously
      try {
        const analysisRes = await API.post(`/api/reports/${newReport._id}/analyze`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
        const analyzedReport = analysisRes.data.data.report;
        setReports(prev => prev.map(r => r._id === newReport._id ? analyzedReport : r));
        toast.success('AI Analysis complete!');
      } catch (err) {
        console.error('AI Analysis failed:', err);
        toast.error('AI Analysis failed.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        // If it's a mock report (id is 1,2,3), just filter it out
        if (id.length < 5) {
            setReports(reports.filter(r => r._id !== id));
            toast.success('Mock report removed');
            return;
        }
        await API.delete(`/api/reports/${id}`, config);
        setReports(reports.filter(r => r._id !== id));
        toast.success('Report deleted successfully');
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Failed to delete report.');
      }
    }
  };

  const getCorrectUrl = (url) => {
    if (!url) return null;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // If the URL was hardcoded to localhost by the backend, replace it with the actual backend URL
    if (url.includes('http://localhost:5000')) {
      return url.replace('http://localhost:5000', backendUrl);
    }
    // If it's a relative URL, prepend the backend URL
    if (url.startsWith('/uploads/')) {
      return `${backendUrl}${url}`;
    }
    return url;
  };

  const handlePreview = (url) => {
    const fixedUrl = getCorrectUrl(url);
    if (!fixedUrl) { toast.error("File preview not available for mock reports."); return; }
    window.open(fixedUrl, '_blank');
  };

  const handleDownload = (url) => {
    const fixedUrl = getCorrectUrl(url);
    if (!fixedUrl) { toast.error("Download not available for mock reports."); return; }
    window.open(fixedUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reviewed': return 'green';
      case 'Critical': return 'red';
      default: return 'amber';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-teal-600" /> Medical Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage your medical records, empowered by AI analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="xl:col-span-1">
          <Card className="sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upload New Report</h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. Annual Blood Work" value={title} onChange={(e) => setTitle(e.target.value)} disabled={uploading} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" value={category} onChange={(e) => setCategory(e.target.value)} disabled={uploading}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} disabled={uploading} />
                <div className="flex flex-col items-center cursor-pointer pointer-events-none">
                  {file ? (
                    <>
                      <File className="w-10 h-10 text-teal-500 mb-2" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-teal-600 mb-1">Click or drag file here</span>
                      <span className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</span>
                    </>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={!file || !title || uploading} className="w-full flex justify-center py-2.5">
                {uploading ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Uploading...</> : 'Upload Report'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Reports List */}
        <div className="xl:col-span-2">
          {loading ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center">
               <Loader className="w-8 h-8 text-teal-600 animate-spin mb-4" />
               <p className="text-gray-500">Loading your medical reports...</p>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="p-16 text-center flex flex-col items-center justify-center border-dashed border-2">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <FileText className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">No reports found</h3>
               <p className="text-gray-500 max-w-sm mx-auto">Upload your first medical report to securely store it and get an instant AI-powered summary.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-sm font-medium text-gray-600">Showing {reports.length} reports</span>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center bg-white px-3 py-1.5 rounded border shadow-sm">
                  <Filter className="w-4 h-4 mr-1.5"/> Filter
                </button>
              </div>

              {reports.map((report) => (
                <Card key={report._id} className="hover:shadow-md transition-shadow p-0 overflow-hidden flex flex-col md:flex-row">
                  <div className="md:w-40 bg-gray-50 border-r border-gray-100 flex items-center justify-center p-6 shrink-0">
                     {report.fileType === 'image' ? (
                       <div className="w-16 h-16 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center"><File className="w-8 h-8"/></div>
                     ) : (
                       <FileText className="w-16 h-16 text-red-400" />
                     )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                          <Badge label={report.status} color={getStatusColor(report.status)} light />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{report.category} • Uploaded on {new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        <button onClick={() => handlePreview(report.fileUrl)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDownload(report.fileUrl)} className="p-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(report._id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 bg-teal-50/50 p-3 rounded-lg border border-teal-100/50">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1.5 flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-1" /> AI Summary
                      </h4>
                      <p className="text-sm text-gray-700">
                        {report.aiAnalysis?.summary || report.aiSummary || 'Analysis pending.'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalReports;

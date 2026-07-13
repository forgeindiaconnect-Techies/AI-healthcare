import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { ShieldAlert, CheckCircle, Clock, XCircle, AlertTriangle, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

const VerificationStatus = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatus = async () => {
    try {
      const { data } = await API.get('/api/doctors/verification-status');
      if (data.data.status === 'APPROVED') {
        navigate('/dashboard/doctor-dashboard');
      } else {
        setStatusData(data.data);
      }
    } catch (error) {
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [navigate]);

  const handleSubmitReview = async () => {
    try {
      await API.post('/api/doctors/submit-verification');
      toast.success('Application submitted for review successfully');
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    }
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      toast.loading('Uploading document...', { id: 'upload' });
      await API.post('/api/doctors/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully', { id: 'upload' });
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload document', { id: 'upload' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your verification status...</div>;
  }

  if (!statusData) return null;

  const { status, medicalLicenseVerificationStatus, rejectionReason, documents } = statusData;

  const getStatusIcon = () => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-16 h-16 text-red-500" />;
      case 'CHANGES_REQUESTED': return <AlertTriangle className="w-16 h-16 text-orange-500" />;
      case 'DRAFT': return <ShieldAlert className="w-16 h-16 text-gray-500" />;
      default: return <Clock className="w-16 h-16 text-blue-500" />; // PENDING, UNDER_REVIEW
    }
  };

  const requiredDocs = [
    { type: 'MEDICAL_LICENSE', label: 'Medical License' },
    { type: 'MEDICAL_DEGREE', label: 'Medical Degree' },
    { type: 'IDENTITY_PROOF', label: 'Government ID' },
    { type: 'HOSPITAL_APPOINTMENT_LETTER', label: 'Clinic/Hospital Registration' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center flex flex-col items-center">
        {getStatusIcon()}
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Account Status: {status.replace('_', ' ')}
        </h1>
        {status === 'DRAFT' && <p className="mt-2 text-gray-600">Please complete uploading mandatory documents and submit for review.</p>}
        {(status === 'PENDING' || status === 'UNDER_REVIEW') && <p className="mt-2 text-gray-600">Your profile is currently under review by our administration team. This process usually takes 1-2 business days.</p>}
        {status === 'CHANGES_REQUESTED' && <p className="mt-2 text-orange-600">Please review the remarks on your documents and re-upload the requested items.</p>}
        {status === 'REJECTED' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-left w-full max-w-2xl">
            <strong>Rejection Reason:</strong> {rejectionReason || 'No specific reason provided.'}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Document Checklist</h2>
        <div className="space-y-4">
          {requiredDocs.map(docReq => {
            const uploadedDoc = documents.find(d => d.documentType === docReq.type);
            return (
              <div key={docReq.type} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-gray-50">
                <div>
                  <h3 className="font-semibold text-gray-800">{docReq.label}</h3>
                  {uploadedDoc ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        uploadedDoc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        uploadedDoc.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        uploadedDoc.verificationStatus === 'REUPLOAD_REQUIRED' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {uploadedDoc.verificationStatus}
                      </span>
                      {uploadedDoc.adminRemarks && (
                        <span className="text-sm text-red-600">Note: {uploadedDoc.adminRemarks}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-red-500 font-medium mt-1 inline-block">Missing</span>
                  )}
                </div>
                
                <div className="mt-3 sm:mt-0">
                  {(!uploadedDoc || uploadedDoc.verificationStatus === 'REUPLOAD_REQUIRED' || uploadedDoc.verificationStatus === 'REJECTED') && (
                    <label className="cursor-pointer bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      Upload New File
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, docReq.type)} />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(status === 'DRAFT' || status === 'CHANGES_REQUESTED') && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmitReview}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            Submit Application for Review
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, Check, ShieldCheck, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner, Badge } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';

const DoctorReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [isVerifyingLicense, setIsVerifyingLicense] = useState(false);
  const [checklist, setChecklist] = useState({ checked: false });
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    fetchReviewData();
  }, [id]);

  const fetchReviewData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await API.get(`/api/admin/doctors/${id}/review`, config);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load review data');
      navigate('/dashboard/doctors');
    } finally {
      setLoading(false);
    }
  };

  const startReview = async () => {
    if (data?.doctor?.status === 'PENDING') {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.patch(`/api/admin/doctors/${id}/start-review`, {}, config);
        fetchReviewData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (data && data.doctor && data.doctor.status === 'PENDING') {
      startReview();
    }
  }, [data]);

  const handleDocumentAction = async (docId, action) => {
    let remarks = '';
    if (action !== 'verify') {
      remarks = prompt(`Reason for ${action}?`);
      if (!remarks) return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/admin/doctors/${id}/documents/${docId}/${action}`, { remarks }, config);
      toast.success(`Document marked as ${action}`);
      fetchReviewData();
    } catch (error) {
      toast.error('Failed to update document status');
    }
  };

  const handleVerifyLicense = async () => {
    try {
      setIsVerifyingLicense(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post(`/api/admin/doctors/${id}/verify-medical-license`, {}, config);
      toast.success('Medical license verified via API');
      fetchReviewData();
    } catch (error) {
      toast.error('Failed to verify license');
    } finally {
      setIsVerifyingLicense(false);
    }
  };

  const handleDoctorAction = async (action) => {
    if (action === 'approve' && !checklist.checked) {
      return toast.error('Please confirm checklist before approving');
    }
    if (action !== 'approve' && !actionReason) {
      return toast.error('Please provide a reason');
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post(`/api/admin/doctors/${id}/${action}`, { 
        reason: actionReason,
        checklistChecked: checklist.checked 
      }, config);
      toast.success(`Doctor application ${action}d`);
      navigate('/dashboard/doctors');
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} doctor`);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size={40} /></div>;
  if (!data) return null;

  const { doctor, documents, verificationHistory } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard/doctors')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Review: Dr. {doctor.user?.name}
            <Badge 
              label={doctor.status} 
              color={doctor.status === 'APPROVED' ? colors.success : doctor.status === 'UNDER_REVIEW' ? colors.warning : colors.error} 
            />
          </h1>
          <p className="text-gray-500 text-sm mt-1">Application received on {new Date(doctor.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex border-b mb-6">
              <button 
                className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'documents' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
              <button 
                className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'license' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('license')}
              >
                License Verification
              </button>
              <button 
                className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </div>

            {activeTab === 'documents' && (
              <div className="space-y-6">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center p-8">No documents uploaded.</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc._id} className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{doc.documentType.replace(/_/g, ' ')}</p>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">View Original File</a>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Badge label={doc.verificationStatus} color={
                          doc.verificationStatus === 'VERIFIED' ? colors.success : 
                          doc.verificationStatus === 'REJECTED' ? colors.error : 
                          doc.verificationStatus === 'REUPLOAD_REQUIRED' ? colors.warning : colors.secondary
                        } />
                        
                        {doc.verificationStatus !== 'VERIFIED' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleDocumentAction(doc._id, 'verify')} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="Verify"><CheckCircle className="w-5 h-5"/></button>
                            <button onClick={() => handleDocumentAction(doc._id, 'request-reupload')} className="p-1.5 bg-orange-50 text-orange-600 rounded hover:bg-orange-100" title="Request Re-upload"><AlertTriangle className="w-5 h-5"/></button>
                            <button onClick={() => handleDocumentAction(doc._id, 'reject')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Reject"><XCircle className="w-5 h-5"/></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'license' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-5 border flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Medical License Number</p>
                    <p className="text-xl font-bold text-gray-900">{doctor.medicalLicenseNumber}</p>
                  </div>
                  <Badge 
                    label={doctor.medicalLicenseVerificationStatus} 
                    color={doctor.medicalLicenseVerificationStatus === 'VERIFIED' ? colors.success : doctor.medicalLicenseVerificationStatus === 'NOT_CHECKED' ? colors.secondary : colors.error} 
                  />
                </div>

                <div className="flex justify-center py-4">
                  <button 
                    onClick={handleVerifyLicense}
                    disabled={isVerifyingLicense}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium shadow flex items-center gap-2 disabled:opacity-50"
                  >
                    {isVerifyingLicense ? <Spinner size={20} color="white" /> : <ShieldCheck className="w-5 h-5" />}
                    {isVerifyingLicense ? 'Verifying...' : 'Run Automated License Check'}
                  </button>
                </div>
                
                {doctor.medicalLicenseVerifiedAt && (
                  <div className="text-sm text-center text-gray-500">
                    Last checked on {new Date(doctor.medicalLicenseVerifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {verificationHistory.length === 0 ? (
                  <p className="text-gray-500">No history available.</p>
                ) : (
                  <div className="border-l-2 border-gray-200 ml-3 pl-4 space-y-6 relative">
                    {verificationHistory.map(entry => (
                      <div key={entry._id} className="relative">
                        <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-[1.35rem] top-1.5 border-2 border-white"></div>
                        <p className="text-sm text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
                        <p className="font-semibold text-gray-800">{entry.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">by {entry.performedByRole} {entry.performedBy?.name ? `(${entry.performedBy.name})` : ''}</p>
                        {entry.remarks && <p className="text-sm text-gray-700 mt-1 italic">"{entry.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-teal-600" />
              Doctor Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{doctor.user?.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{doctor.user?.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Specialization</p>
                <p className="font-medium text-gray-900">{doctor.specialization}</p>
              </div>
              <div>
                <p className="text-gray-500">Qualification</p>
                <p className="font-medium text-gray-900">{doctor.qualification || doctor.education?.[0]?.degree || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Experience</p>
                <p className="font-medium text-gray-900">{doctor.experience} years</p>
              </div>
              <div>
                <p className="text-gray-500">Hospital/Clinic</p>
                <p className="font-medium text-gray-900">{doctor.hospital?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Final Decision</h3>
            
            <label className="flex items-start gap-3 mb-4 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-100">
              <input 
                type="checkbox" 
                checked={checklist.checked} 
                onChange={(e) => setChecklist({ checked: e.target.checked })}
                className="mt-1 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">I confirm that all mandatory documents have been verified, the medical license is active and valid, and this doctor is approved to practice on the platform.</span>
            </label>

            <textarea 
              className="w-full border rounded-lg p-3 text-sm focus:ring-teal-500 mb-4" 
              placeholder="Reason / Remarks (Required for Reject/Changes)"
              rows="3"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleDoctorAction('approve')}
                className={`py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${checklist.checked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={() => handleDoctorAction('reject')}
                className="py-2 px-4 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
              >
                Reject
              </button>
              <button 
                onClick={() => handleDoctorAction('request-changes')}
                className="col-span-2 py-2 px-4 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200"
              >
                Request Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorReview;

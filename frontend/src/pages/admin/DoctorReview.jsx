import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, Check, ShieldCheck, User as UserIcon, ExternalLink, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Spinner, Badge, Button } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';
import DocumentPreviewModal from '../../components/admin/DocumentPreviewModal';

const DoctorReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [checklist, setChecklist] = useState({ checked: false });
  const [actionReason, setActionReason] = useState('');
  
  // Document Viewing State
  const [viewedDocuments, setViewedDocuments] = useState({});
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  
  // Action Modal State
  const [actionModal, setActionModal] = useState({ open: false, type: '', docId: '', reason: '' });

  // Manual License Verification State
  const [nmcWebsiteOpened, setNmcWebsiteOpened] = useState(false);
  const [licenseVerifyForm, setLicenseVerifyForm] = useState({
    registeredNameFound: '',
    registrationNumberFound: '',
    registrationYear: '',
    medicalCouncil: '',
    qualificationFound: '',
    registrationStatus: '',
    verificationResult: '',
    remarks: '',
    adminConfirmed: false
  });
  const [isSubmittingLicense, setIsSubmittingLicense] = useState(false);

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

  const handleViewDocument = async (docId) => {
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewUrl('');
    setPreviewMetadata(null);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await API.get(`/api/admin/doctors/${id}/documents/${docId}/view`, config);
      
      setPreviewMetadata(res.data.document);
      setPreviewUrl(res.data.document.previewUrl);
      
      setViewedDocuments(prev => ({ ...prev, [docId]: true }));
    } catch (error) {
      setPreviewError(error.response?.data?.message || 'Document could not be loaded.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleVerifyDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to verify this document?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/admin/doctors/${id}/documents/${docId}/verify`, { remarks: 'Document checked and verified.' }, config);
      toast.success('Document verified');
      fetchReviewData();
    } catch (error) {
      toast.error('Failed to verify document');
    }
  };

  const submitDocumentAction = async (e) => {
    e.preventDefault();
    if (!actionModal.reason.trim()) {
      return toast.error('Reason is required');
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/admin/doctors/${id}/documents/${actionModal.docId}/${actionModal.type}`, { reason: actionModal.reason }, config);
      toast.success(`Document marked as ${actionModal.type.replace('-', ' ')}`);
      setActionModal({ open: false, type: '', docId: '', reason: '' });
      fetchReviewData();
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  const copyRegistrationNumber = async () => {
    if (data?.doctor?.medicalLicenseNumber) {
      await navigator.clipboard.writeText(data.doctor.medicalLicenseNumber);
      toast.success("Registration number copied.");
    }
  };

  const openNmcRegister = () => {
    const NMC_REGISTER_URL = "https://www.nmc.org.in/information-desk/indian-medical-register/";
    window.open(NMC_REGISTER_URL, "_blank", "noopener,noreferrer");
    setNmcWebsiteOpened(true);
  };

  const handleManualLicenseSubmit = async (e) => {
    e.preventDefault();
    
    if (!licenseVerifyForm.adminConfirmed) {
      return toast.error("You must confirm the verification.");
    }
    
    setIsSubmittingLicense(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/admin/doctors/${id}/license-verification`, licenseVerifyForm, config);
      toast.success('License verification recorded successfully');
      setNmcWebsiteOpened(false);
      
      // Reset form
      setLicenseVerifyForm({
        registeredNameFound: '',
        registrationNumberFound: '',
        registrationYear: '',
        medicalCouncil: '',
        qualificationFound: '',
        registrationStatus: '',
        verificationResult: '',
        remarks: '',
        adminConfirmed: false
      });
      
      fetchReviewData();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to submit license verification');
    } finally {
      setIsSubmittingLicense(false);
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
      toast.error(error.response?.data?.error || error.response?.data?.message || `Failed to ${action} doctor`);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size={40} /></div>;
  if (!data) return null;

  const { doctor, documents, verificationHistory } = data;

  const mandatoryTypes = ['IDENTITY_PROOF', 'MEDICAL_LICENSE', 'MEDICAL_DEGREE'];
  const allMandatoryDocumentsVerified = mandatoryTypes.every(type => {
    const doc = documents.find(d => d.documentType === type);
    return doc && (doc.verificationStatus === 'verified' || doc.verificationStatus === 'VERIFIED');
  });

  const canApproveDoctor = allMandatoryDocumentsVerified && doctor.isLicenseVerified === true && doctor.licenseVerificationStatus === 'verified';

  const getStatusBadgeColor = (status) => {
    const s = status?.toLowerCase();
    if (s === 'verified' || s === 'active') return colors.success;
    if (s === 'rejected' || s === 'not_found' || s === 'mismatch' || s === 'suspended' || s === 'cancelled') return colors.error;
    if (s === 'changes_requested' || s === 'reupload_required' || s === 'under_review') return colors.warning;
    return colors.secondary;
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    const s = status.toLowerCase();
    if (s === 'changes_requested') return 'Changes Requested';
    if (s === 'not_found') return 'Record Not Found';
    if (s === 'mismatch') return 'Details Mismatch';
    if (s === 'under_review') return 'Under Review';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

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
              label={doctor.approvalStatus || doctor.status} 
              color={doctor.approvalStatus === 'approved' ? colors.success : doctor.approvalStatus === 'rejected' ? colors.error : colors.warning} 
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
                  documents.map(doc => {
                    const isViewed = viewedDocuments[doc._id];
                    return (
                    <div key={doc._id} className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-lg flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{doc.documentType.replace(/_/g, ' ')}</p>
                          <button 
                            type="button"
                            onClick={() => handleViewDocument(doc._id)}
                            className="text-sm text-teal-600 hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
                          >
                            View Original File
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Badge label={getStatusLabel(doc.verificationStatus)} color={getStatusBadgeColor(doc.verificationStatus)} />
                        
                        {doc.verificationStatus !== 'verified' && doc.verificationStatus !== 'VERIFIED' && (
                          <div className="flex gap-2" title={!isViewed ? "View this document before taking an action." : ""}>
                            <button 
                              disabled={!isViewed}
                              onClick={() => handleVerifyDocument(doc._id)} 
                              className={`p-1.5 rounded ${isViewed ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} 
                              title="Verify"
                            >
                              <CheckCircle className="w-5 h-5"/>
                            </button>
                            <button 
                              disabled={!isViewed}
                              onClick={() => setActionModal({ open: true, type: 'request-changes', docId: doc._id, reason: '' })} 
                              className={`p-1.5 rounded ${isViewed ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} 
                              title="Request Changes"
                            >
                              <AlertTriangle className="w-5 h-5"/>
                            </button>
                            <button 
                              disabled={!isViewed}
                              onClick={() => setActionModal({ open: true, type: 'reject', docId: doc._id, reason: '' })} 
                              className={`p-1.5 rounded ${isViewed ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} 
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5"/>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )})
                )}
              </div>
            )}

            {activeTab === 'license' && (
              <div className="space-y-6">
                
                <div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800 text-lg">Registration Details (Submitted)</h4>
                    <Badge label={getStatusLabel(doctor.licenseVerificationStatus)} color={getStatusBadgeColor(doctor.licenseVerificationStatus)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Doctor Full Name</p>
                      <p className="font-medium text-gray-900">{doctor.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Qualification</p>
                      <p className="font-medium text-gray-900">{doctor.qualification || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-gray-500">Registration / License Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-base bg-gray-100 px-2 py-1 rounded inline-block">{doctor.medicalLicenseNumber}</p>
                        <button onClick={copyRegistrationNumber} className="text-gray-400 hover:text-teal-600 p-1" title="Copy Registration Number">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Registration Year</p>
                      <p className="font-medium text-gray-900">{doctor.graduationYear || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Registration Council / State Medical Council</p>
                      <p className="font-medium text-gray-900">{doctor.registrationCouncil || doctor.medicalCouncil || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border rounded-xl shadow-inner text-center">
                  <ShieldCheck className="w-12 h-12 text-teal-600 mb-3" />
                  <h4 className="font-bold text-gray-800 mb-2">Official Manual Verification</h4>
                  <p className="text-sm text-gray-600 mb-4 max-w-md">
                    Search using the doctor's registration number, name, registration year and medical council. Return to this page and record the verification result.
                  </p>
                  
                  <button 
                    type="button"
                    onClick={openNmcRegister}
                    className="nmc-verification-button bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium shadow-md flex items-center gap-2 transition-transform active:scale-95"
                  >
                    Open NMC Indian Medical Register <ExternalLink size={18} />
                  </button>
                </div>

                {nmcWebsiteOpened && (
                  <div className="bg-white border-2 border-teal-100 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Record Verification Result</h4>
                    <form onSubmit={handleManualLicenseSubmit} className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name found in register</label>
                          <input type="text" className="w-full border rounded-md p-2 text-sm focus:ring-teal-500" value={licenseVerifyForm.registeredNameFound} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, registeredNameFound: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration number found</label>
                          <input type="text" className="w-full border rounded-md p-2 text-sm focus:ring-teal-500" value={licenseVerifyForm.registrationNumberFound} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, registrationNumberFound: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration year</label>
                          <input type="text" className="w-full border rounded-md p-2 text-sm focus:ring-teal-500" value={licenseVerifyForm.registrationYear} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, registrationYear: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State Medical Council</label>
                          <input type="text" className="w-full border rounded-md p-2 text-sm focus:ring-teal-500" value={licenseVerifyForm.medicalCouncil} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, medicalCouncil: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Qualification found</label>
                          <input type="text" className="w-full border rounded-md p-2 text-sm focus:ring-teal-500" value={licenseVerifyForm.qualificationFound} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, qualificationFound: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration status *</label>
                          <select required className="w-full border rounded-md p-2 text-sm focus:ring-teal-500 bg-white" value={licenseVerifyForm.registrationStatus} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, registrationStatus: e.target.value})}>
                            <option value="">Select status...</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="not_available">Not Available</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification result *</label>
                          <select required className="w-full border rounded-md p-2 text-sm focus:ring-teal-500 bg-white" value={licenseVerifyForm.verificationResult} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, verificationResult: e.target.value})}>
                            <option value="">Select result...</option>
                            <option value="matched">Record Matched</option>
                            <option value="not_found">Record Not Found</option>
                            <option value="mismatch">Details Mismatch</option>
                            <option value="requires_review">Requires Further Review</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin remarks</label>
                        <textarea className="w-full border rounded-md p-2 text-sm focus:ring-teal-500" rows="2" placeholder="Required for mismatch or not found..." value={licenseVerifyForm.remarks} onChange={e => setLicenseVerifyForm({...licenseVerifyForm, remarks: e.target.value})} />
                      </div>

                      <label className="flex items-start gap-3 p-3 bg-teal-50 rounded border border-teal-100 cursor-pointer">
                        <input 
                          type="checkbox" 
                          required
                          checked={licenseVerifyForm.adminConfirmed} 
                          onChange={(e) => setLicenseVerifyForm({ ...licenseVerifyForm, adminConfirmed: e.target.checked })}
                          className="mt-1 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-teal-900 font-medium">I confirm that I checked this doctor using the official NMC Indian Medical Register and compared the registration details.</span>
                      </label>

                      <div className="flex justify-end pt-2">
                        <button 
                          type="submit"
                          disabled={!licenseVerifyForm.adminConfirmed || !licenseVerifyForm.registrationStatus || !licenseVerifyForm.verificationResult || isSubmittingLicense}
                          className="bg-teal-600 text-white px-6 py-2 rounded font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmittingLicense && <Spinner size={16} color="white" />}
                          Confirm License Verification
                        </button>
                      </div>

                    </form>
                  </div>
                )}
                
                {doctor.licenseVerifiedAt && (
                  <div className="text-sm text-center text-gray-500 bg-gray-50 p-3 rounded-lg border">
                    Last verified on <strong>{new Date(doctor.licenseVerifiedAt).toLocaleString()}</strong>
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
                        
                        {entry.metadata?.source && (
                          <p className="text-xs font-medium text-teal-700 bg-teal-50 inline-block px-2 py-0.5 rounded mt-1 mb-1 border border-teal-100">Source: {entry.metadata.source}</p>
                        )}
                        
                        <p className="text-sm text-gray-600">by {entry.performedByRole} {entry.performedBy?.name ? `(${entry.performedBy.name})` : ''}</p>
                        {entry.remarks && <p className="text-sm text-gray-700 mt-1 italic bg-gray-50 p-2 rounded border border-gray-100">"{entry.remarks}"</p>}
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
            
            {(!allMandatoryDocumentsVerified || doctor.licenseVerificationStatus !== 'verified') && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Verify all mandatory documents and complete the medical-license verification before approving this doctor.</span>
              </div>
            )}

            <label className={`flex items-start gap-3 mb-4 p-3 rounded-lg border ${canApproveDoctor ? 'bg-gray-50 border-gray-100 cursor-pointer' : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'}`}>
              <input 
                type="checkbox" 
                checked={checklist.checked} 
                onChange={(e) => setChecklist({ checked: e.target.checked })}
                disabled={!canApproveDoctor}
                className="mt-1 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
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
                disabled={!canApproveDoctor || !checklist.checked}
                className={`py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${(canApproveDoctor && checklist.checked) ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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

      <DocumentPreviewModal 
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        documentMetadata={previewMetadata}
        previewUrl={previewUrl}
        doctorName={doctor.user?.name}
        isLoading={previewLoading}
        error={previewError}
      />

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {actionModal.type === 'reject' ? 'Reject Document' : 'Request Changes'}
              </h3>
            </div>
            <form onSubmit={submitDocumentAction}>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">Please provide a reason. This will be visible to the doctor.</p>
                <textarea
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-teal-500 focus:border-teal-500 outline-none"
                  rows="4"
                  placeholder="Reason..."
                  value={actionModal.reason}
                  onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setActionModal({ open: false, type: '', docId: '', reason: '' })}>Cancel</Button>
                <Button variant="primary" type="submit">Submit</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReview;

import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/SharedUI';

const PendingDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingDoctor, setRejectingDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/doctors/pending');
      setDoctors(res.data.data);
    } catch (error) {
      toast.error("Failed to load pending doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this doctor?")) return;
    
    setProcessing(true);
    try {
      await api.patch(`/api/admin/doctors/${id}/approve`);
      toast.success("Doctor approved successfully.");
      setDoctors(doctors.filter(d => d._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve doctor");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    
    setProcessing(true);
    try {
      await api.patch(`/api/admin/doctors/${rejectingDoctor._id}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      toast.success("Doctor registration rejected.");
      setDoctors(doctors.filter(d => d._id !== rejectingDoctor._id));
      setRejectingDoctor(null);
      setRejectionReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject doctor");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pending Doctor Approvals</h2>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {doctors.length} Pending
        </span>
      </div>

      {doctors.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No pending doctor approvals at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {doctors.map(doctor => (
            <div key={doctor._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{doctor.user?.name}</h3>
                  <p className="text-gray-500">{doctor.user?.email} • {doctor.user?.phone}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Specialization:</span>
                    <p className="font-medium">{doctor.specialization}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Qualification:</span>
                    <p className="font-medium">{doctor.qualification || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Experience:</span>
                    <p className="font-medium">{doctor.experience} Years</p>
                  </div>
                  <div>
                    <span className="text-gray-500">License Number:</span>
                    <p className="font-medium">{doctor.medicalLicenseNumber || doctor.registeredNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Clinic/Hospital:</span>
                    <p className="font-medium">{doctor.hospital?.name || doctor.clinicName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-medium">
                      {[doctor.user?.address?.city, doctor.user?.address?.state].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Registered On:</span>
                    <p className="font-medium">{new Date(doctor.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-3 min-w-[140px] w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <Button 
                  variant="primary" 
                  onClick={() => handleApprove(doctor._id)} 
                  disabled={processing}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Approve
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => setRejectingDoctor(doctor)} 
                  disabled={processing}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Reject
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/dashboard/doctors/${doctor._id}/review`, '_blank')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-red-600">Reject Doctor</h3>
              <button onClick={() => setRejectingDoctor(null)} className="text-gray-400 hover:text-gray-600 p-1">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejecting <strong>{rejectingDoctor.user?.name}</strong>. This will be shown to the doctor.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  rows="4"
                  placeholder="E.g., Invalid medical license number..."
                  required
                />
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setRejectingDoctor(null)} disabled={processing}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={processing || !rejectionReason.trim()}>
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDoctors;

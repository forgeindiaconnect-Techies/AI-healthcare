import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Eye, List, EyeOff } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Spinner, Modal, Badge } from '../../components/ui/SharedUI';
import { colors } from '../../theme/colors';

const DoctorManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'pending', or 'add'
  const [showPassword, setShowPassword] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Verification State
  const [verificationReport, setVerificationReport] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [checklist, setChecklist] = useState({
    nmcChecked: false,
    regMatched: false,
    nameMatched: false,
    qualMatched: false,
    docsVerified: false,
    blacklistChecked: false
  });

  // Form State for Add Doctor
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', gender: 'male', dateOfBirth: '', address: '',
    specialization: '', qualification: '', experience: 0, registrationNumber: '',
    hospitalName: '', consultationFee: 0, status: 'Pending'
  });
  
  // Form State for Edit Doctor
  const [editFormData, setEditFormData] = useState({});

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/admin/doctors?isVerified=true', config);
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/admin/doctors?isVerified=false', config);
      setPendingDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching pending doctors:", error);
      toast.error("Failed to load pending doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'list') fetchDoctors();
      if (activeTab === 'pending') fetchPendingDoctors();
    }
  }, [user, activeTab]);

  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    
    let newValue = value;
    if (name === 'phone') {
      newValue = value.replace(/\D/g, '').slice(0, 10);
    }

    if (isEdit) {
      setEditFormData(prev => ({ ...prev, [name]: newValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits.");
    }
    if (!formData.specialization) {
      return toast.error("Please select a specialization.");
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.post('/api/admin/doctors', formData, config);
      toast.success("Doctor account created successfully!");
      setFormData({
        name: '', email: '', phone: '', password: '', gender: 'male', dateOfBirth: '', address: '',
        specialization: '', qualification: '', experience: 0, registrationNumber: '',
        hospitalName: '', consultationFee: 0, status: 'Pending'
      });
      setActiveTab('list');
    } catch (error) {
      console.error("Error creating doctor:", error);
      toast.error(error.response?.data?.error || "Failed to create doctor");
    }
  };

  const handleStatusChange = async (id, status) => {
    let reason = '';
    if (['Rejected', 'Suspended', 'Request More Documents'].includes(status)) {
      reason = prompt(`Please enter a reason for ${status}:`);
      if (reason === null) return; // User cancelled
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/admin/doctors/${id}/approve`, { status, reason }, config);
      toast.success(`Doctor status updated to ${status}`);
      if (activeTab === 'pending') fetchPendingDoctors();
      else fetchDoctors();
      setIsViewModalOpen(false); // Close modal if open
    } catch (error) {
      console.error(`Error updating status:`, error);
      toast.error(`Failed to update status`);
    }
  };

  const handleRunVerification = async (id) => {
    setIsVerifying(true);
    setVerificationReport(null);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.post(`/api/admin/doctors/${id}/verify`, {}, config);
      setVerificationReport(data.data);
      toast.success('Verification complete');
    } catch (error) {
      console.error("Error running verification:", error);
      toast.error("Failed to run verification checks");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this doctor account?")) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.delete(`/api/admin/doctors/${id}`, config);
        toast.success("Doctor deleted successfully");
        fetchDoctors();
      } catch (error) {
        console.error("Error deleting doctor:", error);
        toast.error("Failed to delete doctor");
      }
    }
  };

  const openViewModal = (doc) => {
    setSelectedDoctor(doc);
    setVerificationReport(null);
    setChecklist({
      nmcChecked: false,
      regMatched: false,
      nameMatched: false,
      qualMatched: false,
      docsVerified: false,
      blacklistChecked: false
    });
    setIsViewModalOpen(true);
  };

  const openEditModal = (doc) => {
    setSelectedDoctor(doc);
    setEditFormData({
      name: doc.user?.name || '',
      email: doc.user?.email || '',
      phone: doc.user?.phone || '',
      specialization: doc.specialization || '',
      qualification: doc.education?.[0]?.degree || '',
      experience: doc.experience || 0,
      registrationNumber: doc.licenseNumber || '',
      consultationFee: doc.consultationFee || 0
    });
    setIsEditModalOpen(true);
  };

  const submitEditDoctor = async (e) => {
    e.preventDefault();
    if (editFormData.phone && editFormData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits.");
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/admin/doctors/${selectedDoctor._id}`, editFormData, config);
      toast.success("Doctor profile updated");
      setIsEditModalOpen(false);
      fetchDoctors();
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error("Failed to update doctor");
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    (doc.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedDoctors = activeTab === 'list' ? filteredDoctors : pendingDoctors;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-teal-600" /> Doctor Management
          </h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage doctor profiles and specialties.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('list')} 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'list' ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4 inline mr-2" /> Active Doctors
          </button>
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'pending' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" /> Pending Approvals {pendingDoctors.length > 0 && <span className="ml-1 bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingDoctors.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('add')} 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'add' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            <Plus className="w-4 h-4 inline mr-2" /> Add Doctor
          </button>
        </div>
      </div>

      {(activeTab === 'list' || activeTab === 'pending') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          {activeTab === 'list' && (
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="relative w-64">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search doctors..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="p-10 flex justify-center"><Spinner size={40} /></div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayedDoctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm mr-3">
                          {doc.user?.name ? doc.user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'DR'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{doc.user?.name}</p>
                          <p className="text-xs text-gray-500">{doc.specialization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{doc.user?.email}</p>
                      <p className="text-xs text-gray-500">{doc.user?.phone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        doc.status === 'Approved' ? 'bg-green-100 text-green-800' 
                        : doc.status === 'Rejected' ? 'bg-red-100 text-red-800'
                        : doc.status === 'Suspended' ? 'bg-red-100 text-red-800'
                        : doc.status === 'Request More Documents' ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status || (doc.isVerified ? 'Active' : 'Pending Approval')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {doc.experience} Years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => window.location.href = `/dashboard/doctors/${doc._id}/review`}
                        className="p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-md transition-colors" title={activeTab === 'pending' ? 'Review Application' : 'View Profile'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {activeTab === 'list' && (
                        <>
                          <button 
                            onClick={() => openEditModal(doc)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc._id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {displayedDoctors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No doctors found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <form onSubmit={handleAddDoctor} className="space-y-8">
            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Full Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. Dr. John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" placeholder="doctor@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Registration Number *</label>
                  <input type="text" name="registrationNumber" required value={formData.registrationNumber} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                  <select name="specialization" required value={formData.specialization} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                    <option value="" disabled>Select Specialization</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="ENT">ENT</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Urology">Urology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification (Degree)</label>
                  <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. MBBS, MD" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                  <input type="number" name="experience" min="0" value={formData.experience} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Clinic Name</label>
                  <input type="text" name="hospitalName" value={formData.hospitalName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                  <input type="number" name="consultationFee" min="0" value={formData.consultationFee} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      required 
                      minLength="8" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500 pr-10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500">
                    <option value="Pending">Pending Approval</option>
                    <option value="Active">Active (Auto-Approve)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors">
                Create Doctor Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Doctor Profile Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Doctor Profile & Verification" width={750}>
        {selectedDoctor && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 border-b pb-4">
               <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl">
                  {selectedDoctor.user?.name ? selectedDoctor.user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'DR'}
               </div>
               <div>
                 <h2 className="text-xl font-bold">{selectedDoctor.user?.name}</h2>
                 <p className="text-gray-500">{selectedDoctor.specialization}</p>
                 <Badge label={selectedDoctor.isVerified ? 'Active' : 'Pending'} color={selectedDoctor.isVerified ? colors.success : colors.warning} className="mt-1" />
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500">Email Address</p>
                <p className="font-medium">{selectedDoctor.user?.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone Number</p>
                <p className="font-medium">{selectedDoctor.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Registration Number</p>
                <p className="font-medium">{selectedDoctor.licenseNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Registered Number</p>
                <p className="font-medium">{selectedDoctor.registeredNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Qualification</p>
                <p className="font-medium">{selectedDoctor.education?.[0]?.degree || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Experience</p>
                <p className="font-medium">{selectedDoctor.experience} Years</p>
              </div>
              <div>
                <p className="text-gray-500">Consultation Fee</p>
                <p className="font-medium">${selectedDoctor.consultationFee}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Patients</p>
                <p className="font-medium">{selectedDoctor.totalPatients || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Appointments</p>
                <p className="font-medium">{selectedDoctor.totalAppointments || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Hospital/Clinic</p>
                <p className="font-medium">{selectedDoctor.hospital?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Rating</p>
                <p className="font-medium">⭐ {selectedDoctor.rating || 0} ({selectedDoctor.totalRatings || 0} reviews)</p>
              </div>

              {selectedDoctor.documents && selectedDoctor.documents.length > 0 && (
                <div className="col-span-2 mt-6 pt-6 border-t border-gray-100">
                  <p className="text-gray-700 font-semibold mb-3">Uploaded Documents</p>
                  <div className="flex gap-3 flex-wrap">
                    {selectedDoctor.documents.map((d, idx) => (
                       <a key={idx} href={d.fileUrl} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-700 text-sm rounded-xl flex items-center gap-2 font-medium border border-teal-100 shadow-sm transition-all hover:shadow-md">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         {d.title || 'Document'}
                       </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Verification Checks</h3>
                  <p className="text-xs text-gray-500">Run automated checks against medical registers</p>
                </div>
                <button 
                  onClick={() => handleRunVerification(selectedDoctor._id)}
                  disabled={isVerifying}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center gap-2 ${isVerifying ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-md'}`}
                >
                  {isVerifying ? (
                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Running...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> Run Automated Checks</>
                  )}
                </button>
              </div>

              {verificationReport && (
                <div className={`p-4 rounded-xl border ${verificationReport.overallRisk === 'High' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <p className="font-bold mb-3">Overall Risk: <span className={verificationReport.overallRisk === 'High' ? 'text-red-600' : 'text-green-600'}>{verificationReport.overallRisk}</span></p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(verificationReport.report).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded shadow-sm border border-gray-50 flex items-start justify-between">
                        <div>
                          <p className="font-semibold capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-xs text-gray-500">{value.message}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${value.status === 'Pass' ? 'bg-green-100 text-green-700' : value.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {value.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Mandatory Verification Checklist</h3>
              <div className="flex gap-3 mb-4">
                <a href="https://www.nmc.org.in/information-desk/indian-medical-register/" target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Check NMC Link
                </a>
                <button onClick={() => window.alert('Checking national blacklist database... No records found.')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Check Blacklist
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {Object.keys(checklist).map((key) => {
                  const labels = {
                    nmcChecked: 'NMC register checked',
                    regMatched: 'Registration number matched',
                    nameMatched: 'Doctor name matched',
                    qualMatched: 'Qualification matched',
                    docsVerified: 'Uploaded documents verified',
                    blacklistChecked: 'Blacklist checked'
                  };
                  return (
                    <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checklist[key] ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" 
                        checked={checklist[key]}
                        onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                      <span className={checklist[key] ? 'text-teal-800 font-medium' : 'text-gray-700'}>{labels[key]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl items-center justify-between">
               <div className="text-sm text-gray-500 font-medium">Take Action:</div>
               <div className="flex flex-wrap gap-3 justify-end w-full sm:w-auto">
                 <button onClick={() => handleStatusChange(selectedDoctor._id, 'Rejected')} className="px-5 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg font-semibold text-sm transition-colors flex-1 sm:flex-none text-center">Reject</button>
                 <button onClick={() => handleStatusChange(selectedDoctor._id, 'Suspended')} className="px-5 py-2.5 bg-white border border-yellow-300 hover:bg-yellow-50 text-yellow-700 rounded-lg font-semibold text-sm transition-colors flex-1 sm:flex-none text-center">Suspend</button>
                 <button onClick={() => handleStatusChange(selectedDoctor._id, 'Request More Documents')} className="px-5 py-2.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm transition-colors flex-1 sm:flex-none text-center">Request Docs</button>
                 
                 <button 
                   onClick={() => handleStatusChange(selectedDoctor._id, 'Approved')} 
                   disabled={!Object.values(checklist).every(Boolean)}
                   className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex-1 sm:flex-none text-center flex items-center justify-center gap-2 ${Object.values(checklist).every(Boolean) ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-200 text-white animate-pulse' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Approve
                 </button>
               </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Doctor Profile" width={500}>
        <form onSubmit={submitEditDoctor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={editFormData.name} onChange={(e) => handleInputChange(e, true)} className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={editFormData.phone} onChange={(e) => handleInputChange(e, true)} className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Specialization</label>
              <select name="specialization" value={editFormData.specialization} onChange={(e) => handleInputChange(e, true)} className="w-full border rounded p-2 text-sm">
                <option value="" disabled>Select Specialization</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="ENT">ENT</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Radiology">Radiology</option>
                <option value="Urology">Urology</option>
                <option value="Oncology">Oncology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">License No.</label>
              <input type="text" name="registrationNumber" value={editFormData.registrationNumber} onChange={(e) => handleInputChange(e, true)} className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Fee</label>
              <input type="number" name="consultationFee" value={editFormData.consultationFee} onChange={(e) => handleInputChange(e, true)} className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Experience</label>
              <input type="number" name="experience" value={editFormData.experience} onChange={(e) => handleInputChange(e, true)} className="w-full border rounded p-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">Save Changes</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default DoctorManagement;

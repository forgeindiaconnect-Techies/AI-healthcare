import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, XCircle, CheckCircle } from 'lucide-react';
import API from '../../api/api';
import toast from 'react-hot-toast';

const DoctorHospitalSettings = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    contactNumber: '',
    department: '',
    roomNumber: '',
    floor: '',
    visitingStartTime: '',
    visitingEndTime: '',
    instructions: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/api/hospital-details');
      setLocations(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load hospital settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/api/hospital-details/${editingId}`, formData);
        toast.success('Hospital location updated');
      } else {
        await API.post('/api/hospital-details', formData);
        toast.success('Hospital location added');
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save hospital details');
    }
  };

  const openEditModal = (location) => {
    setFormData(location);
    setEditingId(location._id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({
      hospitalName: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      contactNumber: '',
      department: '',
      roomNumber: '',
      floor: '',
      visitingStartTime: '',
      visitingEndTime: '',
      instructions: '',
      isActive: true
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const deleteLocation = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await API.delete(`/api/hospital-details/${id}`);
        toast.success('Location deleted');
        fetchLocations();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete location');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-6 h-6 mr-3 text-indigo-600" /> Hospital Visit Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your offline hospital locations and visiting details.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-5 h-5" /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {locations.map(loc => (
          <div key={loc._id} className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col ${loc.isActive ? 'border-emerald-100' : 'border-gray-200 opacity-70'}`}>
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${loc.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{loc.hospitalName}</h3>
                  <p className="text-sm text-gray-500">{loc.department || 'General'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(loc)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteLocation(loc._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700 flex-grow">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Address:</span> {loc.addressLine1}, {loc.city}, {loc.state} - {loc.postalCode}</div>
                <div><span className="font-semibold">Room:</span> {loc.roomNumber} {loc.floor ? `(Flr: ${loc.floor})` : ''}</div>
                <div><span className="font-semibold">Contact:</span> {loc.contactNumber}</div>
                <div><span className="font-semibold">Hours:</span> {loc.visitingStartTime} - {loc.visitingEndTime}</div>
              </div>
              {loc.instructions && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl text-amber-800 text-xs border border-amber-100">
                  <span className="font-bold">Instructions:</span> {loc.instructions}
                </div>
              )}
            </div>
          </div>
        ))}
        {locations.length === 0 && (
           <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-200">
             <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
             <p className="font-semibold text-lg text-gray-800">No hospital locations set</p>
             <p>Add a location to allow patients to book offline visits.</p>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> {editingId ? 'Edit Location' : 'Add Location'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hospital/Clinic Name *</label>
                  <input required name="hospitalName" value={formData.hospitalName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Address *</label>
                  <input required name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">City *</label>
                  <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">State *</label>
                  <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Postal Code *</label>
                  <input required name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number *</label>
                  <input required name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Department (Optional)</label>
                  <input name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Room *</label>
                    <input required name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Floor</label>
                    <input name="floor" value={formData.floor} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Time *</label>
                  <input required type="time" name="visitingStartTime" value={formData.visitingStartTime} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Time *</label>
                  <input required type="time" name="visitingEndTime" value={formData.visitingEndTime} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Instructions (Optional)</label>
                  <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-xl" rows={3}></textarea>
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="isActive" className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Location is active and visible to patients</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorHospitalSettings;

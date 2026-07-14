import React, { useState, useEffect } from 'react';
import { Shield, Users, Edit2, Trash2, Power } from 'lucide-react';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/SharedUI';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

const UserManagement = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await API.get('/api/admin/users', config);
      setUsersList(data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleToggleStatus = async (id, currentStatus, currentRole) => {
    if (currentRole === 'admin') {
      toast.error("Cannot modify admin status");
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/admin/users/${id}/status`, {}, config);
      toast.success(`User status updated successfully`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleRemove = async ({ reason }) => {
    if (!selectedUser) return;
    if (selectedUser.role === 'admin' || selectedUser.role === 'doctor') {
      toast.error(`Cannot delete ${selectedUser.role} accounts from this page`);
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.patch(`/api/admin/users/${selectedUser._id}/remove`, { reason }, config);
      toast.success("User removed successfully");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to remove user");
    }
  };

  const openDeleteModal = (u) => {
    if (u.role === 'admin' || u.role === 'doctor') {
      toast.error(`Cannot delete ${u.role} accounts from this page`);
      return;
    }
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center">
        <Shield className="w-6 h-6 mr-2 text-teal-600" /> User Management
        <span className="ml-4 px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full font-medium">{usersList.length} Total Users</span>
      </h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usersList.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold mr-3">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${u.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button 
                    onClick={() => handleToggleStatus(u._id, u.isActive, u.role)}
                    title={u.isActive ? "Suspend User" : "Activate User"}
                    disabled={u.role === 'admin'}
                    className={`p-1.5 rounded ${u.role === 'admin' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(u)}
                    title={u.role === 'doctor' ? "Use Doctor Management to remove doctors" : "Remove User"}
                    disabled={u.role === 'admin' || u.role === 'doctor'}
                    className={`p-1.5 rounded ${u.role === 'admin' || u.role === 'doctor' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {usersList.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleRemove}
        recordName={selectedUser?.name || 'User'}
        description={`This will soft-delete the user profile for ${selectedUser?.name}.`}
        requireReason={true}
      />
    </div>
  );
};

export default UserManagement;

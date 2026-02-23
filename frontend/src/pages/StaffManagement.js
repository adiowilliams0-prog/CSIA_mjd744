import React, { useState, useEffect } from 'react';
import { getStaff, toggleStaffStatus, createStaff } from '../api/api';
import './StaffManagement.css'; // Import the new CSS

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', role: 'detailer', password: '', confirm_password: ''
  });

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const data = await getStaff();
      setStaff(data);
    } catch (err) { alert("Failed to fetch staff list."); }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await toggleStaffStatus(userId);
      fetchStaff();
    } catch (err) { alert("Error updating status."); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) return alert("Passwords do not match!");
    try {
      await createStaff(formData);
      setShowModal(false);
      setFormData({ first_name: '', last_name: '', role: 'detailer', password: '', confirm_password: '' });
      fetchStaff();
    } catch (err) { alert("Error creating staff: " + err.msg); }
  };

  return (
    <div className="staff-page">
      <div className="staff-header">
        <h1>Staff Management</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Create New Staff</button>
      </div>

      <table className="staff-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map(member => (
            <tr key={member.user_id}>
              <td>{member.full_name}</td>
              <td>{member.username}</td>
              <td>{member.user_role}</td>
              <td>
                <span className={`status-badge ${member.is_active ? 'status-active' : 'status-inactive'}`}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button onClick={() => handleToggleStatus(member.user_id)}>
                  {member.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Staff</h2>
            <form onSubmit={handleCreateStaff}>
              <input type="text" placeholder="First Name" required 
                onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
              <input type="text" placeholder="Last Name" required 
                onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <option value="manager">Manager</option>
                <option value="detailer">Detailer</option>
              </select>
              <input type="password" placeholder="Password" required 
                onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <input type="password" placeholder="Confirm Password" required 
                onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} />

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
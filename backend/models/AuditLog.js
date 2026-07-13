const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  previousStatus: { type: String },
  newStatus: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByRole: { type: String },
  reason: { type: String },
  remarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

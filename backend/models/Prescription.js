const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    prescriptionNumber: { type: String, unique: true },
    diagnosis: { type: String, required: true },
    medicines: [
      {
        name: { type: String, required: true },
        genericName: String,
        dosage: { type: String, required: true },
        frequency: { type: String, required: true }, // "twice daily"
        duration: { type: String, required: true }, // "7 days"
        quantity: Number,
        instructions: String,
        beforeFood: { type: Boolean, default: false },
        refillAllowed: { type: Boolean, default: false },
      },
    ],
    labTests: [
      {
        testName: String,
        urgency: { type: String, enum: ['routine', 'urgent', 'stat'] },
        notes: String,
      },
    ],
    instructions: String,
    followUpDate: Date,
    validUntil: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired', 'VOID'],
      default: 'active',
    },
    dispensedAt: Date,
    dispensedBy: String,
    pharmacyNotes: String,
    digitalSignature: String,
    isDigital: { type: Boolean, default: true },
    pdfUrl: String,
    refillCount: { type: Number, default: 0 },
    maxRefills: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Auto-generate prescription number
prescriptionSchema.pre('save', async function (next) {
  if (!this.prescriptionNumber) {
    const count = await this.constructor.countDocuments();
    this.prescriptionNumber = `RX-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });


module.exports = mongoose.model('Prescription', prescriptionSchema);

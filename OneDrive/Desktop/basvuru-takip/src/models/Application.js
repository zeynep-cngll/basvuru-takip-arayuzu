const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    ownerEmail: { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    applicantName: { type: String, default: '', trim: true },
    applicantPhone: { type: String, default: '', trim: true },
    applicantLinkedIn: { type: String, default: '', trim: true },
    applicantCvUrl: { type: String, default: '', trim: true },
    status: { type: String, default: 'Başvuruldu' },
    priority: { type: String, default: 'Düşük' },
    location: { type: String, default: 'Bilinmiyor' },
    jobType: { type: String, default: 'Belirtilmedi' },
    appliedAt: { type: String, default: '' },
    updatedAt: { type: String, default: '' },
    notes: { type: String, default: '-' }
  },
  { timestamps: true }
);

applicationSchema.index({ ownerEmail: 1, company: 1, role: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = { Application };


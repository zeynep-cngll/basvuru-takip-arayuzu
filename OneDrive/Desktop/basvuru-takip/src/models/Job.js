const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    location: { type: String, default: 'Bilinmiyor', trim: true },
    jobType: { type: String, default: 'Belirtilmedi', trim: true },
    priority: { type: String, enum: ['Düşük', 'Orta', 'Yüksek'], default: 'Düşük' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

jobSchema.index({ company: 1, role: 1 }, { unique: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = { Job };


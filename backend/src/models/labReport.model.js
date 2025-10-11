import mongoose, { Schema, Document } from 'mongoose';

const labReportSchema = new Schema({
  sampleId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  microbiologistId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  testType: { 
    type: String, 
    required: true, 
    enum: ['gram_stain', 'culture_sensitivity', 'pcr', 'antigen', 'other'] 
  },
  pathogen: { 
    type: String,
    trim: true 
  },
  results: { 
    type: String, 
    required: true,
    trim: true 
  },
  antibioticSensitivity: [{ 
    type: String,
    trim: true 
  }],
  findings: { 
    type: String, 
    required: true,
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  aiSuggestions: [{ 
    type: String,
    trim: true 
  }],
  isSynced: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

labReportSchema.index({ patientId: 1 });
labReportSchema.index({ microbiologistId: 1 });
labReportSchema.index({ status: 1 });
labReportSchema.index({ isSynced: 1 });

export default mongoose.model('LabReport', labReportSchema);
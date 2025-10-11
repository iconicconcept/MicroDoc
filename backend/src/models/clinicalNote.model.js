import mongoose, { Schema, Document } from 'mongoose';

const clinicalNoteSchema = new Schema({
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  clinicianId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['clinical', 'lab', 'procedure'] 
  },
  content: { 
    type: String, 
    required: true,
    trim: true 
  },
  transcript: { 
    type: String,
    trim: true 
  },
  summary: { 
    type: String,
    trim: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  isSynced: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

clinicalNoteSchema.index({ patientId: 1, createdAt: -1 });
clinicalNoteSchema.index({ clinicianId: 1, createdAt: -1 });
clinicalNoteSchema.index({ isSynced: 1 });

export default mongoose.model('ClinicalNote', clinicalNoteSchema);
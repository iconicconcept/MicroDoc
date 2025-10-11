import mongoose, { Schema, Document } from 'mongoose';

const patientSchema = new Schema({
  patientId: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  age: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 150 
  },
  gender: { 
    type: String, 
    required: true, 
    enum: ['male', 'female', 'other'] 
  },
  contact: { 
    type: String,
    trim: true 
  },
  address: { 
    type: String,
    trim: true 
  },
  medicalHistory: { 
    type: String 
  },
  allergies: [{ 
    type: String,
    trim: true 
  }]
}, {
  timestamps: true
});

// patientSchema.index({ patientId: 1 });
patientSchema.index({ name: 1 });

export default mongoose.model('Patient', patientSchema);
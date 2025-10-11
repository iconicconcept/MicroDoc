import mongoose, { Schema, Document } from 'mongoose';

const burnoutEntrySchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  hoursWorked: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 24 
  },
  mood: { 
    type: String, 
    required: true, 
    enum: ['excellent', 'good', 'neutral', 'stressed', 'exhausted'] 
  },
  stressLevel: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  notes: { 
    type: String,
    trim: true 
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now 
  }
}, {
  timestamps: true
});

burnoutEntrySchema.index({ userId: 1, date: -1 });
burnoutEntrySchema.index({ date: 1 });

export default mongoose.model('BurnoutEntry', burnoutEntrySchema);
import ClinicalNote from '../models/clinicalNote.model.js';
import Patient from '../models/Patient.model.js';

export const getClinicalNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { clinicianId: req.user?.userId };
    
    if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const notes = await ClinicalNote.find(filter)
      .populate('patientId', 'name patientId age gender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ClinicalNote.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items: notes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get clinical notes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clinical notes' 
    });
  }
};

export const getClinicalNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findOne({
      _id: id,
      clinicianId: req.user?.userId
    }).populate('patientId', 'name patientId age gender contact');

    if (!note) {
      res.status(404).json({ 
        success: false,
        error: 'Clinical note not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Get clinical note by ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clinical note' 
    });
  }
};

export const createClinicalNote = async (req, res) => {
  try {
    const { patientId, type, content, transcript, summary, priority } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ 
        success: false,
        error: 'Patient not found' 
      });
      return;
    }

    const note = await ClinicalNote.create({
      patientId,
      clinicianId: req.user?.userId,
      type,
      content,
      transcript,
      summary,
      priority: priority || 'medium',
      isSynced: true
    });

    await note.populate('patientId', 'name patientId age gender');

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Create clinical note error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create clinical note' 
    });
  }
};

export const updateClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const note = await ClinicalNote.findOneAndUpdate(
      { _id: id, clinicianId: req.user?.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'name patientId age gender');

    if (!note) {
      res.status(404).json({ 
        success: false,
        error: 'Clinical note not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Update clinical note error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update clinical note' 
    });
  }
};

export const deleteClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findOneAndDelete({
      _id: id,
      clinicianId: req.user?.userId
    });

    if (!note) {
      res.status(404).json({ 
        success: false,
        error: 'Clinical note not found' 
      });
      return;
    }

    res.json({
      success: true,
      message: 'Clinical note deleted successfully'
    });
  } catch (error) {
    console.error('Delete clinical note error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete clinical note' 
    });
  }
};

export const getNotesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ 
        success: false,
        error: 'Patient not found' 
      });
      return;
    }

    const notes = await ClinicalNote.find({
      patientId,
      clinicianId: req.user?.userId
    })
      .populate('patientId', 'name patientId age gender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ClinicalNote.countDocuments({
      patientId,
      clinicianId: req.user?.userId
    });

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          patientId: patient.patientId,
          age: patient.age,
          gender: patient.gender
        },
        notes: {
          items: notes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      }
    });
  } catch (error) {
    console.error('Get notes by patient error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch patient notes' 
    });
  }
};

export const generateSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findOne({
      _id: id,
      clinicianId: req.user?.userId
    });

    if (!note) {
      res.status(404).json({ 
        success: false,
        error: 'Clinical note not found' 
      });
      return;
    }

    // Simulate AI summary generation
    // In production, integrate with OpenAI or similar service
    const aiSummary = `AI-generated summary for clinical note: ${note.content.substring(0, 100)}... 
Key points extracted: Patient presentation, symptoms, and recommended follow-up.`;

    note.summary = aiSummary;
    await note.save();

    res.json({
      success: true,
      data: {
        summary: aiSummary,
        note: await note.populate('patientId', 'name patientId age gender')
      }
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate summary' 
    });
  }
};
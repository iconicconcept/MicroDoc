import ClinicalNote from "../models/clinicalNote.model.js";
import Patient from "../models/Patient.model.js";

export const getClinicalNotes = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { clinicianId: req.user?.userId };

    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.type) filter.type = req.query.type;

    const [notes, total] = await Promise.all([
      ClinicalNote.find(filter)
        .populate("patientId", "name patientId age gender cardNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClinicalNote.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items: notes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ Get clinical notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch clinical notes",
    });
  }
};

export const getClinicalNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findOne({
      _id: id,
      clinicianId: req.user?.userId,
    }).populate("patientId", "name patientId age gender contact cardNumber");

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Clinical note not found",
      });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error("❌ Get clinical note by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch clinical note",
    });
  }
};

export const createClinicalNote = async (req, res) => {
  try {
    const {
      patientId,
      type,
      content,
      transcript,
      summary,
      priority,
      chiefComplaint,
      diagnosis,
      plan,
    } = req.body;

    if (!patientId || !type || !content) {
      return res.status(400).json({
        success: false,
        error: "Patient ID, type, and content are required",
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    // Create note
    const note = await ClinicalNote.create({
      patientId,
      clinicianId: req.user?.userId,
      type,
      content,
      transcript,
      summary,
      priority: priority || "medium",
      chiefComplaint,
      diagnosis,
      plan,
      isSynced: true,
    });

    await note.populate("patientId", "name patientId age gender cardNumber");

    res.status(201).json({
      success: true,
      message: "Clinical note created successfully",
      data: note,
    });
  } catch (error) {
    console.error("❌ Create clinical note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create clinical note",
    });
  }
};

export const updateClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      type,
      content,
      transcript,
      summary,
      priority,
      chiefComplaint,
      diagnosis,
      plan,
    } = req.body;

    const updateData = {
      type,
      content,
      transcript,
      summary,
      priority,
      chiefComplaint,
      diagnosis,
      plan,
    };


    const note = await ClinicalNote.findOneAndUpdate(
      { _id: id, clinicianId: req.user?.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate("patientId", "name patientId age gender cardNumber");

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Clinical note not found",
      });
    }

    res.json({
      success: true,
      message: "Clinical note updated successfully",
      data: note,
    });
  } catch (error) {
    console.error("❌ Update clinical note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update clinical note",
    });
  }
};

export const deleteClinicalNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findOneAndDelete({
      _id: id,
      clinicianId: req.user?.userId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Clinical note not found",
      });
    }

    res.json({
      success: true,
      message: "Clinical note deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete clinical note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete clinical note",
    });
  }
};

export const getNotesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    const [notes, total] = await Promise.all([
      ClinicalNote.find({ patientId, clinicianId: req.user?.userId })
        .populate("patientId", "name patientId age gender cardNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClinicalNote.countDocuments({ patientId, clinicianId: req.user?.userId }),
    ]);

    res.json({
      success: true,
      data: {
        patient: {
          id: patient._id,
          name: patient.name,
          patientId: patient.patientId,
          age: patient.age,
          gender: patient.gender,
          cardNumber: patient.cardNumber || "Not provided",
        },
        notes: {
          items: notes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Get notes by patient error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient notes",
    });
  }
};

export const generateSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClinicalNote.findOne({
      _id: id,
      clinicianId: req.user?.userId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Clinical note not found",
      });
    }

    // ✅ Simulate AI summary generation
    const aiSummary = `Summary: ${note.content.slice(0, 100)}...
Key insights extracted: symptoms, findings, and recommendations.`;

    note.summary = aiSummary;
    await note.save();

    await note.populate("patientId", "name patientId age gender cardNumber");

    res.json({
      success: true,
      message: "AI summary generated successfully",
      data: note,
    });
  } catch (error) {
    console.error("❌ Generate summary error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate summary",
    });
  }
};

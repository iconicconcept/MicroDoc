import Patient from "../models/Patient.model.js";
import ClinicalNote from "../models/clinicalNote.model.js";
import LabReport from "../models/labReport.model.js";

export const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
      ];
    }

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items: patients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patients",
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      res.status(404).json({
        success: false,
        error: "Patient not found",
      });
      return;
    }

    // Get recent clinical notes and lab reports for this patient
    const recentNotes = await ClinicalNote.find({ patientId: id })
      .populate("clinicianId", "name role")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentLabReports = await LabReport.find({ patientId: id })
      .populate("microbiologistId", "name role")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const stats = {
      totalNotes: await ClinicalNote.countDocuments({ patientId: id }),
      totalLabReports: await LabReport.countDocuments({ patientId: id }),
      pendingReports: await LabReport.countDocuments({
        patientId: id,
        status: "pending",
      }),
    };

    res.json({
      success: true,
      data: {
        patient,
        recentActivity: {
          clinicalNotes: recentNotes,
          labReports: recentLabReports,
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get patient by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient details",
    });
  }
};

export const createPatient = async (req, res) => {
  try {
    const {
      patientId,
      name,
      age,
      gender,
      contact,
      address,
      medicalHistory,
      allergies,
      bloodGroup,
      cardNumber,
      assignedClinician,
      registeredBy,
    } = req.body;

    // Check if patient ID already exists
    const existingPatient = await Patient.findOne({ patientId });
    if (existingPatient) {
      res.status(400).json({
        success: false,
        error: "Patient ID already exists",
      });
      return;
    }

    // Check if card number already exists (if provided)
    if (cardNumber) {
      const existingCard = await Patient.findOne({
        cardNumber: cardNumber.trim(),
      });
      if (existingCard) {
        return res.status(400).json({
          success: false,
          error: "Card number already registered",
        });
      }
    }

    const patient = await Patient.create({
      patientId,
      name,
      age,
      gender,
      contact,
      address,
      medicalHistory,
      bloodGroup,
      assignedClinician,
      registeredBy,
      cardNumber: cardNumber?.trim() || "",
      allergies: allergies || [],
    });

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Create patient error:", error);
    console.error("Error creating patient:", error.response?.data);
    res.status(500).json({
      success: false,
      error: "Failed to create patient",
    });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const patient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: "Patient not found",
      });
      return;
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Update patient error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update patient",
    });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      res.status(404).json({
        success: false,
        error: "Patient not found",
      });
      return;
    }

    // Also delete associated clinical notes and lab reports
    await ClinicalNote.deleteMany({ patientId: id });
    await LabReport.deleteMany({ patientId: id });

    res.json({
      success: true,
      message: "Patient and associated records deleted successfully",
    });
  } catch (error) {
    console.error("Delete patient error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete patient",
    });
  }
};

export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        error: "Search query is required",
      });
      return;
    }

    const patients = await Patient.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { patientId: { $regex: q, $options: "i" } },
        { contact: { $regex: q, $options: "i" } },
      ],
    })
      .select("name patientId age gender contact")
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        items: patients,
        total: patients.length,
      },
    });
  } catch (error) {
    console.error("Search patients error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search patients",
    });
  }
};

export const getPatientStats = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const patientsWithNotes = await ClinicalNote.distinct("patientId");
    const patientsWithLabReports = await LabReport.distinct("patientId");

    const genderStats = await Patient.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const ageGroups = await Patient.aggregate([
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 18, 40, 60, 80, 150],
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        patientsWithClinicalNotes: patientsWithNotes.length,
        patientsWithLabReports: patientsWithLabReports.length,
        genderDistribution: genderStats,
        ageDistribution: ageGroups,
      },
    });
  } catch (error) {
    console.error("Get patient stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient statistics",
    });
  }
};

import LabReport from '../models/labReport.model.js';
import Patient from '../models/Patient.model.js';

export const getLabReports = async (req, res)=> {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { microbiologistId: req.user?.userId };
    
    if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.testType) {
      filter.testType = req.query.testType;
    }

    const reports = await LabReport.find(filter)
      .populate('patientId', 'name patientId age gender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await LabReport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items: reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get lab reports error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lab reports' 
    });
  }
};

export const getLabReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await LabReport.findOne({
      _id: id,
      microbiologistId: req.user?.userId
    }).populate('patientId', 'name patientId age gender contact medicalHistory');

    if (!report) {
      res.status(404).json({ 
        success: false,
        error: 'Lab report not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get lab report by ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lab report' 
    });
  }
};

export const createLabReport = async (req, res)=> {
  try {
    const {
      sampleId,
      patientId,
      testType,
      pathogen,
      results,
      antibioticSensitivity,
      findings,
      status
    } = req.body;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ 
        success: false,
        error: 'Patient not found' 
      });
      return;
    }

    // Check if sample ID already exists
    const existingReport = await LabReport.findOne({ sampleId });
    if (existingReport) {
      res.status(400).json({ 
        success: false,
        error: 'Sample ID already exists' 
      });
      return;
    }

    const report = await LabReport.create({
      sampleId,
      patientId,
      microbiologistId: req.user?.userId,
      testType,
      pathogen,
      results,
      antibioticSensitivity: antibioticSensitivity || [],
      findings,
      status: status || 'pending',
      aiSuggestions: [],
      isSynced: true
    });

    await report.populate('patientId', 'name patientId age gender');

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Create lab report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create lab report' 
    });
  }
};

export const updateLabReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const report = await LabReport.findOneAndUpdate(
      { _id: id, microbiologistId: req.user?.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'name patientId age gender');

    if (!report) {
      res.status(404).json({ 
        success: false,
        error: 'Lab report not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update lab report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update lab report' 
    });
  }
};

export const deleteLabReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await LabReport.findOneAndDelete({
      _id: id,
      microbiologistId: req.user?.userId
    });

    if (!report) {
      res.status(404).json({ 
        success: false,
        error: 'Lab report not found' 
      });
      return;
    }

    res.json({
      success: true,
      message: 'Lab report deleted successfully'
    });
  } catch (error) {
    console.error('Delete lab report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete lab report' 
    });
  }
};

export const getReportsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404).json({ 
        success: false,
        error: 'Patient not found' 
      });
      return;
    }

    const reports = await LabReport.find({
      patientId,
      microbiologistId: req.user?.userId
    })
      .populate('patientId', 'name patientId age gender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await LabReport.countDocuments({
      patientId,
      microbiologistId: req.user?.userId
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
        reports: {
          items: reports,
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
    console.error('Get reports by patient error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch patient reports' 
    });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await LabReport.findOneAndUpdate(
      { _id: id, microbiologistId: req.user?.userId },
      { status },
      { new: true, runValidators: true }
    ).populate('patientId', 'name patientId age gender');

    if (!report) {
      res.status(404).json({ 
        success: false,
        error: 'Lab report not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update report status' 
    });
  }
};

export const generateAISuggestions = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await LabReport.findOne({
      _id: id,
      microbiologistId: req.user?.userId
    });

    if (!report) {
      res.status(404).json({ 
        success: false,
        error: 'Lab report not found' 
      });
      return;
    }

    // Simulate AI suggestions based on report content
    const aiSuggestions = [
      'Consider testing for antibiotic resistance patterns',
      'Recommend follow-up culture in 48 hours',
      'Check for multi-drug resistant strains',
      'Consider susceptibility testing for additional antibiotics'
    ];

    report.aiSuggestions = aiSuggestions;
    await report.save();

    res.json({
      success: true,
      data: {
        suggestions: aiSuggestions,
        report: await report.populate('patientId', 'name patientId age gender')
      }
    });
  } catch (error) {
    console.error('Generate AI suggestions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate AI suggestions' 
    });
  }
};
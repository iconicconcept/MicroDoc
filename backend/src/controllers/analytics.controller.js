import ClinicalNote from '../models/clinicalNote.model.js';
import LabReport from '../models/labReport.model.js';
import Patient from '../models/Patient.model.js';
import BurnoutEntry from '../models/burnoutEntry.model.js';
import User from '../models/user.model.js';
// import { AuthRequest } from '../middleware/auth.js';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, format } from 'date-fns';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    // Base filters based on user role
    const baseFilter = userRole === 'admin' ? {} : 
                      userRole === 'clinician' ? { clinicianId: userId } : 
                      { microbiologistId: userId };

    // Current month stats
    const currentMonthNotes = await ClinicalNote.countDocuments({
      ...baseFilter,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    const currentMonthReports = await LabReport.countDocuments({
      ...baseFilter,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
    });

    // Last month stats for comparison
    const lastMonthNotes = await ClinicalNote.countDocuments({
      ...baseFilter,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const lastMonthReports = await LabReport.countDocuments({
      ...baseFilter,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Total stats
    const totalPatients = await Patient.countDocuments();
    const totalNotes = await ClinicalNote.countDocuments(baseFilter);
    const totalLabReports = await LabReport.countDocuments(baseFilter);

    // Burnout stats (for clinicians and microbiologists)
    let burnoutStats = null;
    if (userRole === 'clinician' || userRole === 'microbiologist') {
      const recentEntries = await BurnoutEntry.find({
        userId,
        date: { $gte: subMonths(new Date(), 1) }
      });

      if (recentEntries.length > 0) {
        const averageHours = recentEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0) / recentEntries.length;
        const averageStress = recentEntries.reduce((sum, entry) => sum + entry.stressLevel, 0) / recentEntries.length;
        
        if (averageHours > 10 && averageStress > 3.5) {
          burnoutRisk = 'high';
        } else if (averageHours > 8 && averageStress > 2.5) {
          burnoutRisk = 'moderate';
        } else {
          burnoutRisk = 'low';
        }

        burnoutStats = {
          averageHours: Math.round(averageHours * 10) / 10,
          averageStress: Math.round(averageStress * 10) / 10,
          burnoutRisk,
          entriesCount: recentEntries.length
        };
      }
    }

    // Today's activity
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    
    const todayNotes = await ClinicalNote.countDocuments({
      ...baseFilter,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const todayReports = await LabReport.countDocuments({
      ...baseFilter,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalPatients,
          totalClinicalNotes: totalNotes,
          totalLabReports,
          pendingLabReports: await LabReport.countDocuments({ ...baseFilter, status: 'pending' })
        },
        monthly: {
          clinicalNotes: {
            current: currentMonthNotes,
            previous: lastMonthNotes,
            trend: currentMonthNotes - lastMonthNotes
          },
          labReports: {
            current: currentMonthReports,
            previous: lastMonthReports,
            trend: currentMonthReports - lastMonthReports
          }
        },
        today: {
          clinicalNotes: todayNotes,
          labReports: todayReports
        },
        burnout: burnoutStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
};

export const getClinicalAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const startDate = req.query.startDate ? new Date(req.query.startDate ) : startOfMonth(new Date());
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const baseFilter = userRole === 'admin' ? {} : { clinicianId: userId };

    const dateFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Note type distribution
    const noteTypeStats = await ClinicalNote.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Priority distribution
    const priorityStats = await ClinicalNote.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily note count for trends
    const dailyStats = await ClinicalNote.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top patients by note count
    const topPatients = await ClinicalNote.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: '$patientId',
          noteCount: { $sum: 1 }
        }
      },
      { $sort: { noteCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $unwind: '$patient'
      },
      {
        $project: {
          patientId: '$patient.patientId',
          patientName: '$patient.name',
          noteCount: 1
        }
      }
    ]);

    // Clinician performance (only for admin)
    let clinicianStats = null;
    if (userRole === 'admin') {
      clinicianStats = await ClinicalNote.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$clinicianId',
            noteCount: { $sum: 1 }
          }
        },
        { $sort: { noteCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'clinician'
          }
        },
        {
          $unwind: '$clinician'
        },
        {
          $project: {
            clinicianName: '$clinician.name',
            clinicianRole: '$clinician.role',
            department: '$clinician.department',
            noteCount: 1
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalNotes: await ClinicalNote.countDocuments({ ...baseFilter, ...dateFilter }),
          noteTypeDistribution: noteTypeStats,
          priorityDistribution: priorityStats
        },
        trends: {
          daily: dailyStats
        },
        topPatients,
        clinicianStats
      }
    });
  } catch (error) {
    console.error('Get clinical analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clinical analytics' 
    });
  }
};

export const getLabAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : startOfMonth(new Date());
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const baseFilter = userRole === 'admin' ? {} : { microbiologistId: userId };

    const dateFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Test type distribution
    const testTypeStats = await LabReport.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: '$testType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Status distribution
    const statusStats = await LabReport.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Common pathogens
    const pathogenStats = await LabReport.aggregate([
      { 
        $match: { 
          ...baseFilter, 
          ...dateFilter,
          pathogen: { $exists: true, $ne: '' }
        } 
      },
      {
        $group: {
          _id: '$pathogen',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily report count for trends
    const dailyStats = await LabReport.aggregate([
      { $match: { ...baseFilter, ...dateFilter } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Turnaround time analysis (completed reports only)
    const turnaroundStats = await LabReport.aggregate([
      { 
        $match: { 
          ...baseFilter, 
          ...dateFilter,
          status: 'completed'
        } 
      },
      {
        $project: {
          turnaroundTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageTurnaround: { $avg: '$turnaroundTime' },
          minTurnaround: { $min: '$turnaroundTime' },
          maxTurnaround: { $max: '$turnaroundTime' }
        }
      }
    ]);

    // Microbiologist performance (only for admin)
    let microbiologistStats = null;
    if (userRole === 'admin') {
      microbiologistStats = await LabReport.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$microbiologistId',
            reportCount: { $sum: 1 },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        { $sort: { reportCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'microbiologist'
          }
        },
        {
          $unwind: '$microbiologist'
        },
        {
          $project: {
            microbiologistName: '$microbiologist.name',
            department: '$microbiologist.department',
            reportCount: 1,
            completedCount: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedCount', '$reportCount'] },
                100
              ]
            }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalReports: await LabReport.countDocuments({ ...baseFilter, ...dateFilter }),
          testTypeDistribution: testTypeStats,
          statusDistribution: statusStats,
          commonPathogens: pathogenStats,
          turnaroundTime: turnaroundStats[0] || {
            averageTurnaround: 0,
            minTurnaround: 0,
            maxTurnaround: 0
          }
        },
        trends: {
          daily: dailyStats
        },
        microbiologistStats
      }
    });
  } catch (error) {
    console.error('Get lab analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lab analytics' 
    });
  }
};

export const getSystemAnalytics = async (req, res) => {
  try {
    const userRole = req.user?.role;
    
    if (userRole !== 'admin') {
      res.status(403).json({ 
        success: false,
        error: 'Access denied. Admin role required.' 
      });
      return;
    }

    const thirtyDaysAgo = subMonths(new Date(), 1);

    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    // System usage trends
    const usageTrends = await ClinicalNote.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          clinicalNotes: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'labreports',
          let: { date: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    '$$date'
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                labReports: { $sum: 1 }
              }
            }
          ],
          as: 'labReports'
        }
      },
      {
        $unwind: {
          path: '$labReports',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          date: '$_id',
          clinicalNotes: 1,
          labReports: '$labReports.labReports'
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Busiest days
    const busiestDays = await ClinicalNote.aggregate([
      {
        $group: {
          _id: {
            $dayOfWeek: '$createdAt'
          },
          noteCount: { $sum: 1 }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id',
          noteCount: 1,
          dayName: {
            $arrayElemAt: [
              ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              '$_id'
            ]
          }
        }
      },
      { $sort: { noteCount: -1 } }
    ]);

    // Department statistics
    const departmentStats = await User.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $group: {
          _id: '$department',
          userCount: { $sum: 1 },
          roles: {
            $push: '$role'
          }
        }
      },
      {
        $project: {
          department: '$_id',
          userCount: 1,
          roleDistribution: {
            clinicians: {
              $size: {
                $filter: {
                  input: '$roles',
                  as: 'role',
                  cond: { $eq: ['$$role', 'clinician'] }
                }
              }
            },
            microbiologists: {
              $size: {
                $filter: {
                  input: '$roles',
                  as: 'role',
                  cond: { $eq: ['$$role', 'microbiologist'] }
                }
              }
            },
            labStaff: {
              $size: {
                $filter: {
                  input: '$roles',
                  as: 'role',
                  cond: { $eq: ['$$role', 'lab_staff'] }
                }
              }
            }
          }
        }
      },
      { $sort: { userCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        userStatistics: userStats,
        usageTrends,
        busiestDays,
        departmentStats,
        summary: {
          totalUsers: await User.countDocuments(),
          activeUsers: await User.countDocuments({ isActive: true }),
          totalPatients: await Patient.countDocuments(),
          totalClinicalNotes: await ClinicalNote.countDocuments(),
          totalLabReports: await LabReport.countDocuments()
        }
      }
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch system analytics' 
    });
  }
};
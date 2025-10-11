import BurnoutEntry from '../models/burnoutEntry.model.js';
// import { AuthRequest } from '../middleware/auth.js';
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, format } from 'date-fns';

export const getBurnoutEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const filter = { userId: req.user?.userId };
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await BurnoutEntry.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await BurnoutEntry.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items: entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get burnout entries error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch burnout entries' 
    });
  }
};

export const createBurnoutEntry = async (req, res) => {
  try {
    const {
      hoursWorked,
      mood,
      stressLevel,
      notes,
      date
    } = req.body;

    // Check if entry already exists for this date
    const existingEntry = await BurnoutEntry.findOne({
      userId: req.user?.userId,
      date: date ? new Date(date) : new Date()
    });

    if (existingEntry) {
      res.status(400).json({ 
        success: false,
        error: 'Entry already exists for this date' 
      });
      return;
    }

    const entry = await BurnoutEntry.create({
      userId: req.user?.userId,
      hoursWorked,
      mood,
      stressLevel,
      notes,
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Create burnout entry error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create burnout entry' 
    });
  }
};

export const updateBurnoutEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const entry = await BurnoutEntry.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!entry) {
      res.status(404).json({ 
        success: false,
        error: 'Burnout entry not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Update burnout entry error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update burnout entry' 
    });
  }
};

export const deleteBurnoutEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await BurnoutEntry.findOneAndDelete({
      _id: id,
      userId: req.user?.userId
    });

    if (!entry) {
      res.status(404).json({ 
        success: false,
        error: 'Burnout entry not found' 
      });
      return;
    }

    res.json({
      success: true,
      message: 'Burnout entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete burnout entry error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete burnout entry' 
    });
  }
};

export const getBurnoutAnalytics = async (req, res) => {
  try {
    const period = (req.query.period) || 'month';
    const userId = req.user?.userId;

    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = startOfWeek(endDate);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        break;
      case 'quarter':
        startDate = startOfQuarter(endDate);
        break;
      case 'year':
        startDate = startOfYear(endDate);
        break;
      default:
        startDate = startOfMonth(endDate);
    }

    // Get entries for the period
    const entries = await BurnoutEntry.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).lean();

    if (entries.length === 0) {
      res.json({
        success: true,
        data: {
          period,
          averageHours: 0,
          averageStress: 0,
          moodDistribution: {},
          burnoutRisk: 'low',
          recommendations: ['Start tracking your work hours and mood to get personalized insights.']
        }
      });
      return;
    }

    // Calculate analytics
    const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const averageHours = totalHours / entries.length;
    
    const totalStress = entries.reduce((sum, entry) => sum + entry.stressLevel, 0);
    const averageStress = totalStress / entries.length;

    // Mood distribution
    const moodDistribution = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    // Calculate burnout risk
    if (averageHours > 10 && averageStress > 3.5) {
      burnoutRisk = 'high';
    } else if (averageHours > 8 && averageStress > 2.5) {
      burnoutRisk = 'moderate';
    } else {
      burnoutRisk = 'low';
    }

    // Generate recommendations
    const recommendations = generateBurnoutRecommendations(averageHours, averageStress, moodDistribution);

    res.json({
      success: true,
      data: {
        period,
        averageHours: Math.round(averageHours * 10) / 10,
        averageStress: Math.round(averageStress * 10) / 10,
        moodDistribution,
        burnoutRisk,
        totalEntries: entries.length,
        recommendations
      }
    });
  } catch (error) {
    console.error('Get burnout analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch burnout analytics' 
    });
  }
};

export const getBurnoutTrends = async (req, res) => {
  try {
    const period = (req.query.period) || 'month';
    const userId = req.user?.userId;

    let daysBack;
    switch (period) {
      case 'week':
        daysBack = 7;
        break;
      case 'month':
        daysBack = 30;
        break;
      case 'quarter':
        daysBack = 90;
        break;
      case 'year':
        daysBack = 365;
        break;
      default:
        daysBack = 30;
    }

    const startDate = subDays(new Date(), daysBack);

    const entries = await BurnoutEntry.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();

    // Group by date for trends
    const trends = entries.reduce((acc, entry) => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          hoursWorked: 0,
          stressLevel: 0,
          mood: '',
          count: 0
        };
      }
      
      acc[dateKey].hoursWorked += entry.hoursWorked;
      acc[dateKey].stressLevel += entry.stressLevel;
      acc[dateKey].count += 1;
      
      // Use the latest mood of the day
      acc[dateKey].mood = entry.mood;
      
      return acc;
    }, {});

    // Calculate averages
    const trendData = Object.values(trends).map((day) => ({
      date: day.date,
      hoursWorked: day.hoursWorked / day.count,
      stressLevel: day.stressLevel / day.count,
      mood: day.mood
    }));

    res.json({
      success: true,
      data: {
        period,
        trends: trendData,
        totalDays: trendData.length
      }
    });
  } catch (error) {
    console.error('Get burnout trends error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch burnout trends' 
    });
  }
};

export const getBurnoutRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Get recent entries for personalized recommendations
    const recentEntries = await BurnoutEntry.find({
      userId,
      date: { $gte: subDays(new Date(), 7) }
    }).lean();

    if (recentEntries.length === 0) {
      res.json({
        success: true,
        data: {
          recommendations: [
            'Start tracking your daily work hours and mood',
            'Take regular breaks during long shifts',
            'Practice stress management techniques',
            'Maintain a healthy work-life balance',
            'Stay hydrated and maintain proper nutrition'
          ]
        }
      });
      return;
    }

    const averageHours = recentEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0) / recentEntries.length;
    const averageStress = recentEntries.reduce((sum, entry) => sum + entry.stressLevel, 0) / recentEntries.length;

    const recommendations = generateBurnoutRecommendations(averageHours, averageStress, {});

    res.json({
      success: true,
      data: {
        recommendations,
        basedOn: {
          averageHours: Math.round(averageHours * 10) / 10,
          averageStress: Math.round(averageStress * 10) / 10,
          period: 'last 7 days'
        }
      }
    });
  } catch (error) {
    console.error('Get burnout recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch burnout recommendations' 
    });
  }
};

// Helper function to generate personalized recommendations
function generateBurnoutRecommendations(
  averageHours, 
  averageStress, 
  moodDistribution
) {
  const recommendations = [];

  if (averageHours > 10) {
    recommendations.push(
      'Consider reducing your work hours to prevent burnout',
      'Take mandatory breaks every 2 hours during long shifts',
      'Delegate tasks when possible to manage workload'
    );
  } else if (averageHours > 8) {
    recommendations.push(
      'Maintain your current schedule but ensure regular breaks',
      'Practice time management techniques',
      'Set clear boundaries between work and personal time'
    );
  }

  if (averageStress > 4) {
    recommendations.push(
      'Practice deep breathing exercises during stressful moments',
      'Consider speaking with a mental health professional',
      'Implement stress-reduction activities like meditation or yoga'
    );
  } else if (averageStress > 3) {
    recommendations.push(
      'Take short walks during breaks to reduce stress',
      'Practice mindfulness techniques',
      'Ensure adequate sleep and rest'
    );
  }

  // Add general wellness recommendations
  recommendations.push(
    'Stay hydrated throughout your shift',
    'Maintain a balanced diet with regular meals',
    'Connect with colleagues for support and camaraderie',
    'Take advantage of your days off for proper rest'
  );

  return recommendations.slice(0, 5); // Return top 5 recommendations
}
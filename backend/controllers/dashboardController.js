import Alert from '../models/Alert.js';
import ThreatReport from '../models/ThreatReport.js';
import SavedIOC from '../models/SavedIOC.js';
import Investigation from '../models/Investigation.js';
import { seedMockData } from '../database/seeder.js';

// @desc    Get SOC Dashboard consolidated metrics and stats
// @route   GET /api/dashboard
// @access  Private (Analyst/Admin)
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Run seeder check: If DB is empty, run seeder automatically
    const reportCheck = await ThreatReport.countDocuments();
    const alertCheck = await Alert.countDocuments();
    if (reportCheck === 0 && alertCheck === 0) {
      console.log('[Dashboard Controller] Database is blank. Running self-seeding routine...');
      await seedMockData();
    }

    // 2. Fetch basic numeric KPI counts
    const totalInvestigations = await Investigation.countDocuments();
    const highSeverityAlerts = await Alert.countDocuments({
      severity: { $in: ['high', 'critical'] },
      status: 'active'
    });
    const criticalCVEs = await ThreatReport.countDocuments({
      severity: 'critical'
    });
    const savedIOCsCount = await SavedIOC.countDocuments();

    // 3. Fetch feed listings (recent reports and active alerts)
    const recentReports = await ThreatReport.find()
      .sort({ publishedAt: -1 })
      .limit(5);

    const activeAlerts = await Alert.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Compute distributions for charts

    // A. Alert Severity Distribution
    const alertSeverities = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          value: { $sum: 1 }
        }
      }
    ]);
    const severityMap = { low: 0, medium: 0, high: 0, critical: 0 };
    alertSeverities.forEach(item => {
      if (item._id in severityMap) {
        severityMap[item._id] = item.value;
      }
    });
    const severityDistribution = Object.keys(severityMap).map(key => ({
      name: key.toUpperCase(),
      value: severityMap[key]
    }));

    // B. Threat Categories Distribution
    const reportCategories = await ThreatReport.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]);
    const categoryDistribution = reportCategories.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.value
    }));

    // C. IOC Types Distribution
    const iocTypes = await SavedIOC.aggregate([
      {
        $group: {
          _id: '$type',
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]);
    const iocDistribution = iocTypes.map(item => ({
      name: item._id.toUpperCase(),
      value: item.value
    }));

    // D. Investigation Sources Distribution (Top Sources)
    const sources = await Investigation.aggregate([
      {
        $group: {
          _id: '$source',
          value: { $sum: 1 }
        }
      },
      { $sort: { value: -1 } }
    ]);
    const topSources = sources.map(item => ({
      name: item._id,
      value: item.value
    }));

    // E. Investigation Monthly Trend (last 6 months)
    const trend = await Investigation.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = trend.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
      investigations: item.count
    }));

    // 5. Build and return dashboard response payload
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        stats: {
          totalInvestigations,
          highSeverityAlerts,
          criticalCVEs,
          savedIOCsCount
        },
        recentReports,
        activeAlerts,
        charts: {
          severityDistribution,
          categoryDistribution,
          iocDistribution,
          topSources,
          monthlyTrend
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

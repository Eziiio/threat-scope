import ThreatReport from '../models/ThreatReport.js';
import { fetchLiveOTXFeed } from '../services/feedService.js';

// @desc    Get threat feed advisories and bulletins
// @route   GET /api/threat-feed
// @access  Private (Analyst/Admin)
export const getThreatFeed = async (req, res, next) => {
  const { category, severity, search, refresh, page, limit } = req.query;

  try {
    // 1. Sync live OTX feed updates if refresh=true is requested
    if (refresh === 'true') {
      console.log('[Threat Feed Controller] Refresh requested. Synchronizing feeds...');
      await fetchLiveOTXFeed();
    }

    // 2. Build MongoDB query filter
    const filterQuery = {};

    if (category) {
      filterQuery.category = category.toLowerCase().trim();
    }

    if (severity) {
      filterQuery.severity = severity.toLowerCase().trim();
    }

    if (search) {
      // Search in title and description using case-insensitive regex
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Configure pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // 4. Query Mongoose database
    const totalCount = await ThreatReport.countDocuments(filterQuery);
    const reports = await ThreatReport.find(filterQuery)
      .sort({ publishedAt: -1 }) // Newest first
      .skip(skipNum)
      .limit(limitNum);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: 'Threat feed retrieved successfully',
      data: {
        reports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

import SavedIOC from '../models/SavedIOC.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Bookmark an IOC to the analyst's watchlist
// @route   POST /api/saved-iocs
// @access  Private (Analyst/Admin)
export const addSavedIOC = async (req, res, next) => {
  const { ioc, type, description, tags } = req.body;
  const userId = req.user._id;

  try {
    // 1. Prevent duplicate watchlist entries for the same operator
    const exists = await SavedIOC.findOne({
      indicator: ioc.trim(),
      createdBy: userId
    });

    if (exists) {
      return next(new ErrorResponse('Indicator already bookmarked on your watchlist', 400));
    }

    // 2. Create the SavedIOC record linked to the operator
    const savedIoc = await SavedIOC.create({
      indicator: ioc.trim(),
      type,
      notes: description || '',
      tags: tags || [],
      createdBy: userId
    });

    // 3. Return mapped payload matching frontend contract
    res.status(201).json({
      success: true,
      message: 'Indicator bookmarked successfully',
      data: {
        _id: savedIoc._id,
        ioc: savedIoc.indicator,
        type: savedIoc.type,
        description: savedIoc.notes,
        tags: savedIoc.tags,
        createdBy: savedIoc.createdBy,
        createdAt: savedIoc.createdAt,
        updatedAt: savedIoc.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get operator's bookmarked watchlist IOCs
// @route   GET /api/saved-iocs
// @access  Private (Analyst/Admin)
export const getSavedIOCs = async (req, res, next) => {
  const { type, tag, search, page, limit } = req.query;
  const userId = req.user._id;

  try {
    // Build query filter restricted to the logged-in user
    const filterQuery = { createdBy: userId };

    if (type) {
      filterQuery.type = type.toLowerCase().trim();
    }

    if (tag) {
      filterQuery.tags = tag.trim();
    }

    if (search) {
      filterQuery.$or = [
        { indicator: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Configure pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Fetch watchlist
    const totalCount = await SavedIOC.countDocuments(filterQuery);
    const iocs = await SavedIOC.find(filterQuery)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skipNum)
      .limit(limitNum);

    const totalPages = Math.ceil(totalCount / limitNum);

    // Map database properties to client-facing fields
    const mappedIocs = iocs.map(item => ({
      _id: item._id,
      ioc: item.indicator,
      type: item.type,
      description: item.notes,
      tags: item.tags,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Saved indicators retrieved successfully',
      data: {
        iocs: mappedIocs,
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

// @desc    Delete an IOC bookmark from watchlist
// @route   DELETE /api/saved-iocs/:id
// @access  Private (Analyst/Admin)
export const deleteSavedIOC = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    // Find bookmark by ID and verify ownership
    const savedIoc = await SavedIOC.findOne({
      _id: id,
      createdBy: userId
    });

    if (!savedIoc) {
      return next(new ErrorResponse('Indicator not found or access denied', 404));
    }

    await savedIoc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Indicator removed from watchlist successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

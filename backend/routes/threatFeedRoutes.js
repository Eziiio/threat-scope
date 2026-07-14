import express from 'express';
import { getThreatFeed } from '../controllers/threatFeedController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getThreatFeed);

export default router;

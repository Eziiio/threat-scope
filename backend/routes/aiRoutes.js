import express from 'express';
import { explainThreat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/explain', explainThreat);

export default router;

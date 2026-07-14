import express from 'express';
import { 
  addSavedIOC, 
  getSavedIOCs, 
  deleteSavedIOC 
} from '../controllers/savedIOCController.js';
import { validateSavedIOC } from '../validators/savedIOCValidator.js';

const router = express.Router();

router.post('/', validateSavedIOC, addSavedIOC);
router.get('/', getSavedIOCs);
router.delete('/:id', deleteSavedIOC);

export default router;

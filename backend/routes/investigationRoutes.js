import express from 'express';
import { 
  investigateIP, 
  investigateDomain, 
  investigateURL, 
  investigateHash 
} from '../controllers/investigationController.js';
import { 
  validateIP, 
  validateDomain, 
  validateURL, 
  validateHash 
} from '../validators/investigationValidator.js';

const router = express.Router();

router.post('/ip', validateIP, investigateIP);
router.post('/domain', validateDomain, investigateDomain);
router.post('/url', validateURL, investigateURL);
router.post('/hash', validateHash, investigateHash);

export default router;

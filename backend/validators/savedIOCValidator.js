import { body } from 'express-validator';
import { validateFields } from '../middleware/validationMiddleware.js';

export const validateSavedIOC = [
  body('ioc')
    .trim()
    .notEmpty()
    .withMessage('IOC indicator value is required'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('IOC type is required')
    .isIn(['ip', 'domain', 'url', 'hash'])
    .withMessage('IOC type must be one of: ip, domain, url, hash'),
  body('description')
    .optional()
    .trim(),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  validateFields
];

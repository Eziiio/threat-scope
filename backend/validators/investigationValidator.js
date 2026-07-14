import { body } from 'express-validator';
import { validateFields } from '../middleware/validationMiddleware.js';

export const validateIP = [
  body('ip')
    .trim()
    .notEmpty()
    .withMessage('IP address is required')
    .isIP()
    .withMessage('Invalid IP address format (must be IPv4 or IPv6)'),
  validateFields
];

export const validateDomain = [
  body('domain')
    .trim()
    .notEmpty()
    .withMessage('Domain name is required')
    .isFQDN({ require_tld: true })
    .withMessage('Invalid Domain name format (must be a valid FQDN like example.com)'),
  validateFields
];

export const validateURL = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL({ require_protocol: true })
    .withMessage('Invalid URL format (must contain a protocol like http:// or https://)'),
  validateFields
];

export const validateHash = [
  body('hash')
    .trim()
    .notEmpty()
    .withMessage('File hash is required')
    .custom((value) => {
      const len = value.length;
      const isHex = /^[a-fA-F0-9]+$/.test(value);
      if (!isHex || (len !== 32 && len !== 40 && len !== 64)) {
        throw new Error('Hash must be MD5 (32 characters), SHA-1 (40 characters), or SHA-256 (64 characters) hex string');
      }
      return true;
    }),
  validateFields
];

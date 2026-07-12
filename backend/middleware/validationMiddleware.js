import { validationResult } from 'express-validator';

// Checks express-validator results and format the error structure
export const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation Failed',
      errors: formattedErrors
    });
  }
  next();
};

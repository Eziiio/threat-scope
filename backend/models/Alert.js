import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true
    },
    severity: {
      type: String,
      required: [true, 'Alert severity is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level'
      }
    },
    status: {
      type: String,
      required: [true, 'Alert status is required'],
      enum: {
        values: ['active', 'suppressed', 'resolved'],
        message: '{VALUE} is not a valid alert status'
      },
      default: 'active',
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;

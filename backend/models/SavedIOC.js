import mongoose from 'mongoose';

const savedIOCSchema = new mongoose.Schema(
  {
    indicator: {
      type: String,
      required: [true, 'IOC indicator value is required'],
      trim: true,
      index: true
    },
    type: {
      type: String,
      required: [true, 'IOC type is required'],
      enum: {
        values: ['ip', 'domain', 'url', 'hash'],
        message: '{VALUE} is not a valid IOC type'
      }
    },
    notes: {
      type: String,
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Analyst creator association is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure analysts don't save duplicate indicators
savedIOCSchema.index({ indicator: 1, createdBy: 1 }, { unique: true });

const SavedIOC = mongoose.model('SavedIOC', savedIOCSchema);

export default SavedIOC;

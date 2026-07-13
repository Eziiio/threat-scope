import mongoose from 'mongoose';

const investigationSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: [true, 'Query value is required'],
      trim: true,
      index: true
    },
    queryType: {
      type: String,
      required: [true, 'Query type is required'],
      enum: {
        values: ['ip', 'domain', 'url', 'hash'],
        message: '{VALUE} is not a valid query type'
      }
    },
    source: {
      type: String,
      required: [true, 'API source is required'],
      trim: true
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'API result data is required']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Investigation = mongoose.model('Investigation', investigationSchema);

export default Investigation;

import mongoose from 'mongoose';

const threatReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true
    },
    severity: {
      type: String,
      required: [true, 'Report severity is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid severity level'
      }
    },
    category: {
      type: String,
      required: [true, 'Report category is required'],
      enum: {
        values: ['malware', 'ransomware', 'zero-day', 'advisory', 'phishing'],
        message: '{VALUE} is not a valid threat category'
      }
    },
    source: {
      type: String,
      required: [true, 'Report source is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Report description is required']
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const ThreatReport = mongoose.model('ThreatReport', threatReportSchema);

export default ThreatReport;

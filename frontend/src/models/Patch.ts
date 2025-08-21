import mongoose from 'mongoose'

export interface IPatch extends mongoose.Document {
  name: string
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'APPROVED' | 'INSTALLED' | 'FAILED' | 'IGNORED'
  lastChecked: Date
  assetId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patch name is required'],
  },
  currentVersion: {
    type: String,
    required: [true, 'Current version is required'],
  },
  latestVersion: {
    type: String,
    required: [true, 'Latest version is required'],
  },
  updateAvailable: {
    type: Boolean,
    default: false,
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'LOW',
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'INSTALLED', 'FAILED', 'IGNORED'],
    default: 'PENDING',
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.Patch || mongoose.model<IPatch>('Patch', PatchSchema)



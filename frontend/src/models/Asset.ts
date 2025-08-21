import mongoose from 'mongoose'

export interface IAsset extends mongoose.Document {
  name: string
  description?: string
  ipAddress?: string
  osType?: string
  userId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
  },
  description: {
    type: String,
    required: false,
  },
  ipAddress: {
    type: String,
    required: false,
  },
  osType: {
    type: String,
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema)



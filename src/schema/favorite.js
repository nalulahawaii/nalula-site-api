import mongoose from 'mongoose'

export default new mongoose.Schema(
  {
    creatorId: mongoose.Schema.Types.ObjectId,
    groupId: mongoose.Schema.Types.ObjectId,
    listingId: String,
  },
  { timestamps: true },
)

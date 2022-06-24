import mongoose from 'mongoose'
export default new mongoose.Schema(
  {
    creatorId: mongoose.Schema.Types.ObjectId,
    name: String,
    isPrivate: Boolean,
  },
  { timestamps: true },
)

import mongoose from 'mongoose'
const MessageSchema = new mongoose.Schema(
  {
    senderId: mongoose.Schema.Types.ObjectId,
    recieverId: mongoose.Schema.Types.ObjectId,
    text: String,
    viewDate: Date,
    data: String,
  },
  { timestamps: true },
)
export default MessageSchema

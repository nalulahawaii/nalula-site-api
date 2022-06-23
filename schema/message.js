const mongoose = require("mongoose");
const MessageSchema = new mongoose.Schema(
  {
    senderId: mongoose.Schema.Types.ObjectId,
    recieverId: mongoose.Schema.Types.ObjectId,
    text: String,
    viewDate: Date,
    data: String,
  },
  { timestamps: true }
);
module.exports = MessageSchema;

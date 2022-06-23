const mongoose = require("mongoose");
module.exports = new mongoose.Schema(
  {
    creatorId: mongoose.Schema.Types.ObjectId,
    name: String,
    isPrivate: Boolean,
  },
  { timestamps: true }
);

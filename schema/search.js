const mongoose = require("mongoose");
const SearchSchema = new mongoose.Schema(
  {
    isInternalNotify: Boolean,
    isEmailNotify: Boolean,
    clickUrl: String,
    clickText: String,
    creatorId: mongoose.Schema.Types.ObjectId,
    notifyDate: Date,
  },
  { timestamps: true }
);
module.exports = SearchSchema;

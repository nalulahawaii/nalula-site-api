const mongoose = require("mongoose");
const MessageSchema = require("../schema/message");
module.exports = mongoose.model("Message", MessageSchema);

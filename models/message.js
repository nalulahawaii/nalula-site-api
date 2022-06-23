const mongoose = require("mongoose");
const MessageSchema = require("../schema/message");
export default mongoose.model("Message", MessageSchema);

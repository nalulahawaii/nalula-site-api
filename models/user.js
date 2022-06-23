const mongoose = require("mongoose");
const UserSchema = require("../schema/user");
module.exports = mongoose.model("User", UserSchema);

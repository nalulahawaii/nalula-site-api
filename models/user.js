const mongoose = require("mongoose");
const UserSchema = require("../schema/user");
export default mongoose.model("User", UserSchema);

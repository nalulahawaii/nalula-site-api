const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  email: String,
  email_verified: String,
  family_name: String,
  given_name: String,
  locale: String,
  name: String,
  nickname: String,
  picture: String,
  sub: String,
  loginCount: Number,
});
module.exports = UserSchema;

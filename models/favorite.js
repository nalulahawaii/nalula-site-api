const mongoose = require("mongoose");
const FavoriteSchema = require("../schema/favorite");
module.exports = mongoose.model("Favorite", FavoriteSchema);

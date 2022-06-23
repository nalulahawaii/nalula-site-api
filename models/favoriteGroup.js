const mongoose = require("mongoose");
const FavoriteGroupSchema = require("../schema/favoriteGroup");
module.exports = mongoose.model("FavoriteGroup", FavoriteGroupSchema);

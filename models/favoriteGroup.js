const mongoose = require("mongoose");
const FavoriteGroupSchema = require("../schema/favoriteGroup");
export default mongoose.model("FavoriteGroup", FavoriteGroupSchema);

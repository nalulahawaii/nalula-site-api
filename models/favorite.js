const mongoose = require("mongoose");
const FavoriteSchema = require("../schema/favorite");
export default mongoose.model("Favorite", FavoriteSchema);

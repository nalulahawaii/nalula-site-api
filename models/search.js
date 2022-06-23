const mongoose = require("mongoose");
const SearchSchema = require("../schema/search");
module.exports = mongoose.model("Search", SearchSchema);

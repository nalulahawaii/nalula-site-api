const mongoose = require("mongoose");
const SearchSchema = require("../schema/search");
export default mongoose.model("Search", SearchSchema);

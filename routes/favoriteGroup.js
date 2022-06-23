"use strict";
const router = require("express").Router();
const { sendJson } = require("../util");
const Favorite = require("../models/favorite");
const FavoriteGroup = require("../models/favoriteGroup");

router.get("/:id", async (req, res) => {
  const favoriteGroup = await FavoriteGroup.findById(req.params.id);
  const favorites = favoriteGroup
    ? await Favorite.find({ groupId: favoriteGroup._id })
    : null;

  sendJson(res, {
    favoriteGroup: {
      ...favoriteGroup._doc,
      favoriteIndices: favorites
        .map((fav, i) => {
          return fav.groupId.toString() == favoriteGroup._id.toString()
            ? i
            : null;
        })
        .filter((idx) => idx !== null),
    },
    favorites,
  });
});
export default router;

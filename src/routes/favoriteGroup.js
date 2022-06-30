import { sendJson } from 'src/util'
import Favorite from 'src/db/mongo/models/favorite.mongo'
import FavoriteGroup from 'src/db/mongo/models/favoriteGroup.mongo'

const router = require('express').Router()

router.get('/:id', async (req, res) => {
  const favoriteGroup = await FavoriteGroup.findById(req.params.id)
  const favorites = favoriteGroup
    ? await Favorite.find({ group: favoriteGroup._id })
    : null

  sendJson(res, {
    favoriteGroup: {
      ...favoriteGroup._doc,
      favoriteIndices: favorites
        .map((fav, i) => fav.group.toString() === favoriteGroup._id.toString()
          ? i
          : null)
        .filter((idx) => idx !== null),
    },
    favorites,
  })
})
export default router

import Favorite from 'src/db/mongo/models/favorite.mongo'
import FavoriteGroup from 'src/db/mongo/models/favoriteGroup.mongo'
import { newLogger } from 'src/services/logging'
import { sendJson } from 'src/util/http'

const log = newLogger('Favorite Group routes')

const router = require('express').Router()

router.get('/:id', async (req, res) => {
  const favoriteGroup = await FavoriteGroup.findById(req.params.id)
  const favorites = favoriteGroup
    ? await Favorite.find({ group: favoriteGroup })
    : null

  sendJson(res, {
    favoriteGroup: {
      ...favoriteGroup._doc,
      favoriteIndices: favorites
        .map((fav, i) => fav.group === favoriteGroup
          ? i
          : null)
        .filter((idx) => idx !== null),
    },
    favorites,
  })
})
export default router

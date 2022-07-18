import Favorite from 'db/mongo/models/favorite.mongo'
import FavoriteGroup from 'db/mongo/models/favoriteGroup.mongo'
import tryToCatch from 'try-to-catch'
import { newLogger } from 'services/logging'
import { sendJson } from 'util/http'
import { reportError } from '../util/error-handling'

const log = newLogger('Favorite Group routes')

const router = require('express').Router()

router.get('/:id', async (req, res) => {
  const [favGrpErr, favoriteGroup] = await tryToCatch(FavoriteGroup.findById, req.params.id)
  if(favGrpErr) {
    reportError({
      e: favGrpErr,
      operation: 'retrieve favorite group',
      extra: {
        groupId: req.params.id,
      },
    })
    return sendJson(res, {
      favoriteGroup: {
        favoriteIndices: [],
      },
      favorites: [],
    })
  }
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

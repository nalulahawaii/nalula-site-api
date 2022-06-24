const router = require('express').Router()
import { sendJson }  from 'src/util'
import Favorite from 'src/models/favorite'
import FavoriteGroup from 'src/models/favoriteGroup'

router.get('/:id', async (req, res) => {
  const favoriteGroup = await FavoriteGroup.findById(req.params.id)
  const favorites = favoriteGroup
    ? await Favorite.find({ groupId: favoriteGroup._id })
    : null

  sendJson(res, {
    favoriteGroup: {
      ...favoriteGroup._doc,
      favoriteIndices: favorites
        .map((fav, i) => {
          return fav.groupId.toString() == favoriteGroup._id.toString()
            ? i
            : null
        })
        .filter((idx) => idx !== null),
    },
    favorites,
  })
})
export default router

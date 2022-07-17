import { newLogger } from '../services/logging'
import { sendJson } from 'util/http'
import Favorite from 'db/mongo/models/favorite.mongo'

const router = require('express').Router()

const log = newLogger('Favorites routes')

router.get('/:userId', async (req, res) => {
  const favorites = await Favorite.find({ creator: req.params.userId })
  sendJson(res, { favorites })
})
export default router

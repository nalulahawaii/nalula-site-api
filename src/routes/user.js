import { esBulk } from 'services/elasticsearch'

import express from 'express'
import User from 'db/mongo/models/user.mongo'
import Favorite from 'db/mongo/models/favorite.mongo'
import FavoriteState from 'db/mongo/models/favoriteState.mongo'
import Message from 'db/mongo/models/message.mongo'
import Search from 'db/mongo/models/search.mongo'
import _ from 'lodash'
import { getNowISO } from 'util/date'
import { sendError, sendJson } from 'util/http'
import { newLogger } from 'services/logging'
import { logValDetailed } from 'util/debug'

const log = newLogger('User routes')

const router = express.Router()

const favoritesChangePaths = ['status', 'price', 'image_hashes', 'tour_url', 'tour_url2', 'tour_url3']

const extractQuery = esQuery => esQuery.slice(1, esQuery.length - 1)

const insertSearchES = (esQuery, userId, _id) => {
  const str = `[{"index": {"_index": "${process.env.ELASTIC_SEARCH_SAVED_SEARCH_INDEX}","_type": "_doc", "_id": "${_id}"}},
  { "user_id": "${userId}", "enabled": "true", "changed": "false", ${extractQuery(esQuery)}}]`
  return esBulk(str)
}

const updateSearchES = (esQuery, userId, _id) => {
  const str = `[{"update": {"_index": "${process.env.ELASTIC_SEARCH_SAVED_SEARCH_INDEX}","_type": "_doc", "_id": "${_id}"}},
  {"doc": { "user_id": "${userId}", "enabled": "true", "changed": "false", "change_time": ""
  )}", ${extractQuery(esQuery)}}, "doc_as_upsert": "true"}]`
  return esBulk(str)
}

export const deleteSearchES = (_id) => {
  const str = `[{"delete": {"_index": "${process.env.ELASTIC_SEARCH_SAVED_SEARCH_INDEX}","_type": "_doc", "_id": "${_id}"}}]`
  return esBulk(str)
}

const applyModifications = async (modifications, user) => {
  if(!modifications) return
  log.debug('applyModifications', logValDetailed(modifications))
  let promises
  const modsByType = _.groupBy(modifications, 'type')

  if(modsByType.favorite) {
    promises = modsByType.favorite.map(async ({ action, data }) => {
      if(['insert', 'update'].includes(action)) {
        const listingId = data.listingId
        const filter = action === 'insert'
          ? {
            listingId,
          }
          : {
            _id: data._id,
          }
        await Favorite.findOneAndUpdate(
          filter,
          {
            ...data,
            creator: user,
          },
          {
            new: true,
            upsert: true,
            omitUndefined: true,
            useFindAndModify: false,
            lean: true,
          },
        )
        await FavoriteState.findOneAndUpdate({
            listingId,
          },
          {
            listingId,
            ..._.pick(data, favoritesChangePaths),
          },
          {
            upsert: true,
            useFindAndModify: false,
          })
      } else if(action === 'delete') {
        await Favorite.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        })
      }
    })
    await Promise.all(promises)
  }

  if(modsByType.message) {
    promises = modsByType.message.map(async ({ action, data }) => {
      if(action === 'insert') {
        await Message.findByIdAndUpdate(
          data._id,
          {
            ...data,
            sender: user._id,
          },
          {
            new: true,
            upsert: true,
            omitUndefined: true,
            lean: true,
          },
        )
      } else if(action === 'update') {
        await Message.findByIdAndUpdate(
          data._id,
          {
            ...data,
            sender: user._id,
          },
          {
            new: true,
            upsert: true,
            omitUndefined: true,
            lean: true,
          },
        )
      } else if(action === 'delete') {
        await Message.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        })
      }
    })
    await Promise.all(promises)
  }

  if(modsByType.search) {
    promises = modsByType.search.map(async ({ action, data }) => {
      if(action === 'insert' || action === 'update') {
        const { _id } = await Search.findOneAndUpdate(
          {
            clickUrl: data.clickUrl,
          },
          {
            ...data,
            creator: user,
            notifyDate: getNowISO(),
          },
          {
            new: true,
            upsert: true,
            omitUndefined: true,
            useFindAndModify: false,
            lean: true,
          },
        )
        if(action === 'insert') {
          await insertSearchES(data.esQuery, user._id, _id)
        } else {
          await updateSearchES(data.esQuery, user._id, _id)
        }
      } else if(action === 'delete') {
        await deleteSearchES(data._id)
        await Search.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        })
      }
    })
    await Promise.all(promises)
  }
}

router.post('/', async (req, res) => {
  const { body } = req
  if(!body.user) {
    sendError(res, ['No user supplied'])
    return
  }
  let user = await User.findOne({ sub: body.user.sub })
  if(!user) {
    user = await User.create({ ...body.user })
  } else {
    user.loginCount = body.user.loginCount
    user.email_verified = body.user.email_verified || 'false'
    await user.save()
  }
  await applyModifications(body.modifications, user)
  const favorites = await Favorite.find({ creator: user })
  const incomingMessages = await Message.find({
    receiver: user,
    viewDate: null,
  })
  const savedSearches = await Search.find({ creator: user })
  sendJson(res, {
    user,
    favorites,
    incomingMessages,
    savedSearches,
  })
})

// router.get("/", async (req, res) => {
//   const users = await User.find({});
//   sendJson(res, users);
// });

router.delete('/:id', async (req, res) => {
  const {
    params: { id },
  } = req
  await Favorite.deleteMany({ creator: id })
  const users = await User.findByIdAndDelete(id)

  sendJson(res, users)
})

export default router

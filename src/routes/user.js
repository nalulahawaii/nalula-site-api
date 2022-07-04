import { esBulk } from 'src/services/elasticsearch'

import express from 'express'
import User from 'src/db/mongo/models/user.mongo'
import Favorite from 'src/db/mongo/models/favorite.mongo'
import FavoriteGroup from 'src/db/mongo/models/favoriteGroup.mongo'
import Message from 'src/db/mongo/models/message.mongo'
import Search from 'src/db/mongo/models/search.mongo'
import _ from 'lodash'
import { newLogger } from 'src/services/logging'
import { getNowISO } from 'src/util/date'
import {
  sendError,
  sendJson,
} from 'src/util/http'

const log = newLogger('User Routes')

const router = express.Router()

const extractQuery = esQuery => esQuery.slice(1, esQuery.length - 1)

const modifySearchES = async str => {
  const res = await esBulk(str)
  if(!res) {
    log.error('bulk api failure! terminate', res)
  } else {
    log.debug(res)
  }
  return res
}

const insertSearchES = (esQuery, userId, _id) => {
  const str = `[{"index": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}},
  { "user_id": "${userId}", "enabled": "true", "changed": "false", ${extractQuery(esQuery)}}]`
  return modifySearchES(str)
}

const updateSearchES = (esQuery, userId, _id) => {
  const str = `[{"update": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}},
  {"doc": { "user_id": "${userId}", "enabled": "true", "changed": "false", "change_time": ""
  )}", ${extractQuery(esQuery)}}, "doc_as_upsert": "true"}]`
  return modifySearchES(str)
}

export const deleteSearchES = (_id) => {
  const str = `[{"delete": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}}]`
  return modifySearchES(str)
}

const applyModifications = async (modifications, user) => {
  if(!modifications) return
  let promises
  const modsByType = _.groupBy(modifications, 'type')
  let lastGroupUpdated

  if(modsByType.favoriteGroup) {
    promises = modsByType.favoriteGroup.map(async ({ action, data }) => {
      if(action === 'insert') {
        lastGroupUpdated = await FavoriteGroup.create({
          creator: user,
          ...data,
        })
      } else if(action === 'update') {
        lastGroupUpdated = await FavoriteGroup.findByIdAndUpdate(
          data._id,
          {
            ...data,
            creator: user,
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          },
        )
      } else if(action === 'delete') {
        const group = await FavoriteGroup.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        })
        await Favorite.deleteMany({ group })
      }
    })
    await Promise.all(promises)
  }

  if(modsByType.favorite) {
    promises = modsByType.favorite.map(async ({ action, data }) => {
      if(action === 'insert') {
        await Favorite.findOneAndUpdate(
          {
            listingId: data.listingId,
            group: data.group,
          },
          {
            ...data,
            creator: user,
            group: data.group || lastGroupUpdated?._id,
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          },
        )
      } else if(action === 'update') {
        await Favorite.findOneAndUpdate(
          {
            _id: data._id,
          },
          {
            ...data,
            creator: user,
            group: data.group || lastGroupUpdated?._id,
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          },
        )
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
            useFindAndModify: false,
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
            useFindAndModify: false,
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
            useFindAndModify: false,
            omitUndefined: true,
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
    await FavoriteGroup.create({
      creator: user,
      name: 'Favorites',
    })
  } else {
    user.loginCount = body.user.loginCount
    await user.save()
  }
  await applyModifications(body.modifications, user)
  const favorites = await Favorite.find({ creator: user })
  const favGroups = await FavoriteGroup.find({ creator: user })
  const incomingMessages = await Message.find({
    receiver: user,
    viewDate: null,
  })
  const savedSearches = await Search.find({ creator: user })
  const favoriteGroups = favGroups.map((favGroup) => ({
    ...favGroup._doc,
    favoriteIndices: favorites
      .map((fav, i) => fav.group && fav.group === favGroup
        ? i
        : null)
      .filter((idx) => idx !== null),
  }))
  sendJson(res, {
    user,
    favorites,
    favoriteGroups,
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
  await FavoriteGroup.deleteMany({ creator: id })
  await Favorite.deleteMany({ creator: id })
  const users = await User.findByIdAndDelete(id)

  sendJson(res, users)
})

export default router

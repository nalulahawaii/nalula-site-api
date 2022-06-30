import moment from 'moment'
import { esBulk } from 'src/services/elasticsearch'

import express from 'express'
import { sendJson } from 'src/util'
import User from 'src/db/mongo/models/user.mongo'
import Favorite from 'src/db/mongo/models/favorite.mongo'
import FavoriteGroup from 'src/db/mongo/models/favoriteGroup.mongo'
import Message from 'src/db/mongo/models/message.mongo'
import Search from 'src/db/mongo/models/search.mongo'

const router = express.Router()

const insertSearchES = async (esQuery, userId, _id) => {
  const str = `[{"index": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}},
  { "user_id": "${userId}", "enabled": "true", "changed": "false", ${esQuery.slice(
    1,
    esQuery.length - 1,
  )}}]`
  const res = await esBulk(str)
  if(!res) {
    console.error('bulk api failure! terminate', res)
  } else {
    console.log(res)
  }
  return res
}

const updateSearchES = async (esQuery, userId, _id) => {
  const str = `[{"update": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}},
  {"doc": { "user_id": "${userId}", "enabled": "true", "changed": "false", "change_time": ""
  )}", ${esQuery.slice(1, esQuery.length - 1)}}, "doc_as_upsert": "true"}]`
  const res = await esBulk(str)
  if(!res) {
    console.error('bulk api failure! terminate', res)
  } else {
    console.log(res)
  }
}

const deleteSearchES = async (userId) => {
  const str = `[{"delete": {"_index": "listing-query-000001","_type": "_doc", "_id": "${userId}"}}]`
  const res = await esBulk(str)
  if(!res) {
    console.error('bulk api failure! terminate', res)
  } else {
    console.log(res)
  }
  return res
}

const applyModifications = async (modifications, user) => {
  if(modifications) {
    const favGroupMods = modifications.filter(
      (mod) => mod.type === 'favoriteGroup',
    )
    let lastGroupUpdated
    let promises = favGroupMods.map(async (mod) => {
      const { action, data } = mod
      if(action === 'insert') {
        lastGroupUpdated = await FavoriteGroup.create({
          creator: user,
          ...data,
        })
      } else if(action === 'update') {
        lastGroupUpdated = await FavoriteGroup.findOneAndUpdate(
          { _id: data._id },
          { ...data, creator: user },
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
    if(promises.length) {
      await Promise.all(promises)
    }

    const favMods = modifications.filter((mod) => mod.type === 'favorite')
    promises = favMods.map(async (mod) => {
      const { action, data } = mod

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
    if(promises.length) {
      await Promise.all(promises)
    }

    const messageMods = modifications.filter((mod) => mod.type === 'message')
    promises = messageMods.map(async (mod) => {
      const { action, data } = mod

      if(action === 'insert') {
        await Message.findOneAndUpdate(
          {
            _id: data._id,
          },
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
        await Message.findOneAndUpdate(
          {
            _id: data._id,
          },
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
    if(promises.length) {
      await Promise.all(promises)
    }

    const searchMods = modifications.filter((mod) => mod.type === 'search')
    promises = searchMods.map(async (mod) => {
      const { action, data } = mod

      if(action === 'insert' || action === 'update') {
        const { _id } = await Search.findOneAndUpdate(
          {
            clickUrl: data.clickUrl,
          },
          {
            ...data,
            creator: user,
            notifyDate: moment().format('YYYY-MM-DD[T]HH:mm:ss'),
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
    if(promises.length) {
      await Promise.all(promises)
    }
  }
}

router.post('/', async (req, res) => {
  const { body } = req
  if(!body.user) {
    sendError(res, ['No user supplied'])
  } else {
    let user = await User.findOne({ sub: body.user.sub })
    if(!user) {
      user = await User.create({ ...body.user })
      const group = await FavoriteGroup.create({
        creator: user,
        name: 'Favorites',
      })
    } else {
      user.loginCount = body.user.loginCount
      user.save()
    }
    await applyModifications(body.modifications, user)
    const favorites = await Favorite.find({ creator: user })
    const favGroups = await FavoriteGroup.find({
      creator: user,
    })
    const incomingMessages = await Message.find({
      receiverId: user._id,
      viewDate: null,
    })
    const savedSearches = await Search.find({
      creator: user,
    })
    const favoriteGroups = favGroups.map((favGroup) => ({
      ...favGroup._doc,
      favoriteIndices: favorites
        .map((fav, i) => fav.group && fav.group.toString() === favGroup._id.toString()
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
  }
})

// router.get("/", async (req, res) => {
//   const users = await User.find({});
//   sendJson(res, users);
// });

router.delete('/:id', async (req, res) => {
  const {
    params: { id },
  } = req
  await FavoriteGroup.deleteMany({ creatorId: id })
  await Favorite.deleteMany({ creatorId: id })
  const users = await User.findByIdAndDelete(id)

  sendJson(res, users)
})

export default router

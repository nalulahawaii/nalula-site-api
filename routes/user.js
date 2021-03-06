import { esBulk } from '../services/elasticsearch'

const router = require("express").Router();
const { sendJson } = require("../util");
const User = require("../models/user");
const Favorite = require("../models/favorite");
const FavoriteGroup = require("../models/favoriteGroup");
const Message = require("../models/message");
const Search = require("../models/search");
const moment = require("moment");

const insertSearchES = async (esQuery, userId, _id) => {
  const str = `[{"index": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}},
  { "user_id": "${userId}", "enabled": "true", "changed": "false", ${esQuery.slice(
    1,
    esQuery.length - 1
  )}}]`;
  const res = await esBulk(str);
  if (!res) {
    console.error("bulk api failure! terminate", res);
  } else {
    console.log(res);
  }
  return res;
};

const updateSearchES = async (esQuery, userId, _id) => {
  const str = `[{"update": {"_index": "listing-query-000001","_type": "_doc", "_id": "${_id}"}},
  {"doc": { "user_id": "${userId}", "enabled": "true", "changed": "false", "change_time": ""
  )}", ${esQuery.slice(1, esQuery.length - 1)}}, "doc_as_upsert": "true"}]`;
  const res = await esBulk(str);
  if (!res) {
    console.error("bulk api failure! terminate", res);
  } else {
    console.log(res);
  }
};

const deleteSearchES = async (userId) => {
  const str = `[{"delete": {"_index": "listing-query-000001","_type": "_doc", "_id": "${userId}"}}]`;
  const res = await esBulk(str);
  if (!res) {
    console.error("bulk api failure! terminate", res);
  } else {
    console.log(res);
  }
  return res;
};

const applyModifications = async (modifications, user) => {
  if (modifications) {
    const favGroupMods = modifications.filter(
      (mod) => mod.type === "favoriteGroup"
    );
    let lastGroupUpdated;
    let promises = favGroupMods.map(async (mod) => {
      const { action, data } = mod;
      if (action === "insert") {
        lastGroupUpdated = await FavoriteGroup.create({
          creatorId: user._id,
          ...data,
        });
      } else if (action === "update") {
        lastGroupUpdated = await FavoriteGroup.findOneAndUpdate(
          { _id: data._id },
          { ...data, creatorId: user._id },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          }
        );
      } else if (action === "delete") {
        const group = await FavoriteGroup.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        });
        await Favorite.deleteMany({ groupId: group._id });
      }
    });
    if (promises.length) {
      await Promise.all(promises);
    }

    const favMods = modifications.filter((mod) => mod.type === "favorite");
    promises = favMods.map(async (mod) => {
      const { action, data } = mod;

      if (action === "insert") {
        await Favorite.findOneAndUpdate(
          {
            listingId: data.listingId,
            groupId: data.groupId,
          },
          {
            ...data,
            creatorId: user._id,
            groupId:
              data.groupId || (lastGroupUpdated ? lastGroupUpdated._id : null),
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          }
        );
      } else if (action === "update") {
        await Favorite.findOneAndUpdate(
          {
            _id: data._id,
          },
          {
            ...data,
            creatorId: user._id,
            groupId:
              data.groupId || (lastGroupUpdated ? lastGroupUpdated._id : null),
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          }
        );
      } else if (action === "delete") {
        await Favorite.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        });
      }
    });
    if (promises.length) {
      await Promise.all(promises);
    }

    const messageMods = modifications.filter((mod) => mod.type === "message");
    promises = messageMods.map(async (mod) => {
      const { action, data } = mod;

      if (action === "insert") {
        await Message.findOneAndUpdate(
          {
            _id: data._id,
          },
          {
            ...data,
            senderId: user._id,
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          }
        );
      } else if (action === "update") {
        await Message.findOneAndUpdate(
          {
            _id: data._id,
          },
          {
            ...data,
            senderId: user._id,
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          }
        );
      } else if (action === "delete") {
        await Message.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        });
      }
    });
    if (promises.length) {
      await Promise.all(promises);
    }

    const searchMods = modifications.filter((mod) => mod.type === "search");
    promises = searchMods.map(async (mod) => {
      const { action, data } = mod;

      if (action === "insert" || action === "update") {
        const { _id } = await Search.findOneAndUpdate(
          {
            clickUrl: data.clickUrl,
          },
          {
            ...data,
            creatorId: user._id,
            notifyDate: moment().format("YYYY-MM-DD[T]HH:mm:ss"),
          },
          {
            new: true,
            upsert: true,
            useFindAndModify: false,
            omitUndefined: true,
            lean: true,
          }
        );
        if (action === "insert") {
          await insertSearchES(data.esQuery, user._id, _id);
        } else {
          await updateSearchES(data.esQuery, user._id, _id);
        }
      } else if (action === "delete") {
        await deleteSearchES(data._id);
        await Search.findByIdAndDelete(data._id, {
          useFindAndModify: false,
        });
      }
    });
    if (promises.length) {
      await Promise.all(promises);
    }
  }
};

router.post("/", async (req, res) => {
  const { body } = req;
  if (!body.user) {
    sendError(res, ["No user supplied"]);
  } else {
    let user = await User.findOne({ sub: body.user.sub });
    if (!user) {
      user = await User.create({ ...body.user });
      const group = await FavoriteGroup.create({
        creatorId: user._id,
        name: "Favorites",
      });
    } else {
      user.loginCount = body.user.loginCount;
      user.save();
    }
    await applyModifications(body.modifications, user);
    const favorites = await Favorite.find({ creatorId: user._id });
    const favGroups = await FavoriteGroup.find({
      creatorId: user._id,
    });
    const incomingMessages = await Message.find({
      recieverId: user._id,
      viewDate: null,
    });
    const savedSearches = await Search.find({
      creatorId: user._id,
    });
    const favoriteGroups = favGroups.map((favGroup) => {
      return {
        ...favGroup._doc,
        favoriteIndices: favorites
          .map((fav, i) => {
            return fav.groupId &&
              fav.groupId.toString() == favGroup._id.toString()
              ? i
              : null;
          })
          .filter((idx) => idx !== null),
      };
    });
    sendJson(res, {
      user,
      favorites,
      favoriteGroups,
      incomingMessages,
      savedSearches,
    });
  }
});

// router.get("/", async (req, res) => {
//   const users = await User.find({});
//   sendJson(res, users);
// });

router.delete("/:id", async (req, res) => {
  const {
    params: { id },
  } = req;
  await FavoriteGroup.deleteMany({ creatorId: id });
  await Favorite.deleteMany({ creatorId: id });
  const users = await User.findByIdAndDelete(id);

  sendJson(res, users);
});

export default router;

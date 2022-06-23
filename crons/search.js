import { esClient, esBulk } from 'services/elasticsearch'

const User = require("../models/user");
const Search = require("../models/search");
const Message = require("../models/message");
const nodemailer = require("nodemailer");
const esb = require("elastic-builder");
const moment = require("moment");

export default {
  times: ["1 0 8 * * *", "1 0 20 * *"], // 8:01 am, 8:01pm
  func: async () => {
    console.log("CronJob: saved search");
    const query = esb
      .requestBodySearch()
      .size(1000)
      .query(esb.matchQuery("changed", true));
    console.log(JSON.stringify(query.toJSON()));

    const {
      body: {
        hits: { hits },
      },
    } = await esClient.search({
      index: "listing-query-000001",
      body: query.toJSON(),
    });
    console.log("hits", hits.length);
    console.log(hits[0])
    if (hits && hits.length) {
      let userIds = new Set();
      let esBulkStr = "";
      const searchIds = hits.map((hit) => {
        const {
          _id,
          _source: { user_id },
        } = hit;
        userIds.add(user_id);
        return _id;
      });
      console.log("searchIds", searchIds);
      console.log("userIds", userIds);
      if (searchIds.length) {
        if (process.env.SAVED_SEARCH_TEST_MODE) {
          const includeCreators = [
            "5f3604378f6eac13f35708a9",
            "5f3719179ca137184aae391d",
            "5f3720ce9ca137184aae391f",
            "5f3c5ffd604412506a549391",
            "5fda4b01968dd12d89a54dfc",
          ];
          userIds = [...userIds].filter((id) => {
            return includeCreators.includes(id);
          });
        } else {
          userIds = [...userIds];
        }

        console.log("filtered user ids", userIds);

        if (userIds.length) {
          const users = await User.find({ _id: [...userIds] });
          console.log("users length", users.length);

          const frequency = process.env.SAVED_SEARCH_TEST_MODE
            ? { minutes: 15 }
            : { hours: 12 };
          const time = moment().subtract(frequency);
          const searches = await Search.find({
            $and: [
              { _id: searchIds },
              {
                $or: [
                  {
                    notifyDate: { $lte: time.toDate() },
                  },
                  { notifyDate: null },
                ],
              },
            ],
          });
          searches.forEach(search => {
             search.notifyDate = moment().format("YYYY-MM-DD[T]HH:mm:ss");
          console.log("search.notifyDate", search.notifyDate);
          esBulkStr += `{ "update" : {"_id" : "${search._id}", "_index" : "listing-query-000001"} },{ "doc" : {"changed" : "false"} },`;
          search.save();
          })
          console.log("searches length", searches.length);
          const userSearches = {};
          let id;
          searches.forEach((search) => {
            id = search.creatorId.toString();
            if (!userSearches[id]) {
              userSearches[id] = [];
            }
            userSearches[id].push(search);
          });
          console.log("userSearches", userSearches);
          if (Object.keys(userSearches).length) {
            const promises = users.map(async (user) => {
              const searches = userSearches[user._id];
              if (searches) {
                let emailClickUrls = [];
                let messageClickUrls = [];
                searches.forEach((search) => {
                  const { isInternalNotify, isEmailNotify, clickUrl } = search;
                  if (isEmailNotify) {
                    emailClickUrls.push(clickUrl);
                  }
                  if (isInternalNotify) {
                    messageClickUrls.push(clickUrl);
                  }
                  // search.notifyDate = moment().format("YYYY-MM-DD[T]HH:mm:ss");
                  // console.log("search.notifyDate", search.notifyDate);
                  // esBulkStr += `{ "update" : {"_id" : "${search._id}", "_index" : "listing-query-000001"} },{ "doc" : {"changed" : "false"} },`;
                  // search.save();
                });
                console.log("emailClickUrls", emailClickUrls);
                if (emailClickUrls.length) {
                  await sendEmail(user, emailClickUrls);
                }
                //console.log("messageClickUrls", messageClickUrls);
                if (messageClickUrls.length) {
                  const text = `Some of your saved searches have new properties!`;
                  await Message.findOneAndUpdate(
                    { recieverId: user._id, text },
                    {
                      recieverId: user._id,
                      text,
                      data: JSON.stringify(messageClickUrls),
                    },
                    {
                      new: true,
                      upsert: true,
                      useFindAndModify: false,
                      omitUndefined: true,
                      lean: true,
                    }
                  );
                }
              }
            });
            await Promise.all(promises);
          }
        }
      }

      if (esBulkStr.length) {
        esBulkStr = esBulkStr.slice(0, -1);
        console.log("esBulkStr", esBulkStr);
        const res = await esBulk(`[${esBulkStr}]`);
        if (!res) {
          console.error("bulk api failure! terminate", res);
        } else {
          //console.log(res);
        }
      }
    }
  },
  runOnStart: true,
};

const sendEmail = async ({ name, email }, clickUrls) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "hello@nalula.com",
      pass: "9998b526642dfe3d88f366208884aa61!!",
    },
  });
  let htmlText = "";
  let text = "";
  clickUrls.forEach((url) => {
    text += `https://nalula.com${url}\n`;
    htmlText += `<p><a href="https://nalula.com${url}">https://nalula.com${url}</a></p>`;
  });
  var textBody = `FROM: Nalula EMAIL: hello@nalula.com MESSAGE: Aloha ${name},\n\nSome of your saved searches have new properties! View the new listings at:\n\n${text}\n\nIf you have questions about the area or a specific property, please reach out to one of the agents that is an expert for your unique search as shown on our agent leaderboard.\n\nIf you would like to make an offer on a specific property, please consider using a Nalula Preferred agent to get a tremendous rebate. Details can be found on each property detail page.\n\nBest regards,\nThe Nalula Team\n\n\n\n\n\n251 Little Falls Drive Wilmington, DE 19808\nPrivacy Policy: https://nalula.com/privacy\nUnsubscribe: Please visit the link to view your saved property and unsave the search`;
  var htmlBody = `<p>Aloha ${name},</p><p>Some of your saved searches have a new property! View the new listings at:</p>${htmlText}<p>If you have questions about the area or a specific property, please reach out to one of the agents that is an expert for your unique search as shown on our agent leaderboard.</p><p>If you would like to make an offer on a specific property, please consider using a Nalula Preferred agent to get a tremendous rebate. Details can be found on each property detail page.</p><p>Best regards,<br />The Nalula Team</p><p style="margin-top: 100px"><small>251 Little Falls Drive Wilmington, DE 19808<br /><a href="https://nalula.com/privacy">Privacy Policy</a><br />Unsubscribe: Please visit the link to view your saved property and unsave the search</small></p>`;
  var mail = {
    from: "Nalula <hello@nalula.com>",
    to: `${name} <${email}>`,
    subject: "A new property matches your saved search",
    text: textBody,
    html: htmlBody,
  };
  const res = await transporter.sendMail(mail);
  return res;
};

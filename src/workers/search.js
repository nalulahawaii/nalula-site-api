import {
  esBulk,
  esClient,
} from 'src/services/elasticsearch'

import nodemailer from 'nodemailer'
import esb from 'elastic-builder'
import moment from 'moment'
import User from 'src/db/mongo/models/user.mongo'
import Search from 'src/db/mongo/models/search.mongo'
import Message from 'src/db/mongo/models/message.mongo'
import { reportError } from 'src/util/error-handling'
import { newLogger } from 'src/services/logging'

import _ from 'lodash'

const log = newLogger('Searches Worker')

const queryAsJSON = esb
  .requestBodySearch()
  .size(1000)
  .query(esb.matchQuery('changed', true))
  .toJSON()

const getChangesHits = async () => {
  try {
    const results = await esClient.search({
      index: 'listing-query-000001',
      body: queryAsJSON,
    })
    const hits = results?.body?.hits?.hits || []
    log.debug('hit count', hits.length)
    return hits
  } catch (e) {
    return repErr({
      e: e.meta.body.error,
      operation: 'Retrieve changes from ElasticSearch',
    })
  }
}

const worker = async () => {
  const hits = await getChangesHits()
  if(_.isEmpty(hits)) return
  log.debug('first hit', hits[0])
  let userIds = new Set()
  let esBulkStr = ''
  const searchIds = hits.map((hit) => {
    const {
      _id,
      _source: { user_id },
    } = hit
    userIds.add(user_id)
    return _id
  })
  log.debug('searchIds', searchIds)
  log.debug('userIds', userIds)
  if(searchIds.length) {
    if(process.env.SAVED_SEARCH_TEST_MODE) {
      const includeCreators = [
        '5f3604378f6eac13f35708a9',
        '5f3719179ca137184aae391d',
        '5f3720ce9ca137184aae391f',
        '5f3c5ffd604412506a549391',
        '5fda4b01968dd12d89a54dfc',
      ]
      userIds = [...userIds].filter((id) => includeCreators.includes(id))
    } else {
      userIds = [...userIds]
    }

    log.debug('filtered user ids', userIds)

    if(userIds.length) {
      const users = await User.find({ _id: [...userIds] })
      log.debug('users length', users.length)

      const frequency = process.env.SAVED_SEARCH_TEST_MODE
        ? { minutes: 15 }
        : { hours: 12 }
      const time = moment().subtract(frequency)
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
      })
      searches.forEach(search => {
        search.notifyDate = moment().format('YYYY-MM-DD[T]HH:mm:ss')
        log.debug('search.notifyDate', search.notifyDate)
        esBulkStr += `{ "update" : {"_id" : "${search._id}", "_index" : "listing-query-000001"} },{ "doc" : {"changed" : "false"} },`
        search.save()
      })
      log.debug('searches length', searches.length)
      const userSearches = {}
      let id
      searches.forEach((search) => {
        id = search.creator._id
        if(!userSearches[id]) userSearches[id] = []
        userSearches[id].push(search)
      })
      log.debug('userSearches', userSearches)
      if(Object.keys(userSearches).length) {
        const promises = users.map(async (user) => {
          const searches = userSearches[user._id]
          if(searches) {
            const emailClickUrls = []
            const messageClickUrls = []
            searches.forEach((search) => {
              const { isInternalNotify, isEmailNotify, clickUrl } = search
              if(isEmailNotify) {
                emailClickUrls.push(clickUrl)
              }
              if(isInternalNotify) {
                messageClickUrls.push(clickUrl)
              }
              // search.notifyDate = moment().format("YYYY-MM-DD[T]HH:mm:ss");
              // log.debug("search.notifyDate", search.notifyDate);
              // esBulkStr += `{ "update" : {"_id" : "${search._id}", "_index" : "listing-query-000001"} },{ "doc" : {"changed" : "false"} },`;
              // search.save();
            })
            log.debug('emailClickUrls', emailClickUrls)
            if(emailClickUrls.length) {
              await sendEmail(user, emailClickUrls)
            }
            // log.debug("messageClickUrls", messageClickUrls);
            if(messageClickUrls.length) {
              const text = `Some of your saved searches have new properties!`
              await Message.findOneAndUpdate(
                { receiverId: user._id, text },
                {
                  receiverId: user._id,
                  text,
                  data: JSON.stringify(messageClickUrls),
                },
                {
                  new: true,
                  upsert: true,
                  useFindAndModify: false,
                  omitUndefined: true,
                  lean: true,
                },
              )
            }
          }
        })
        await Promise.all(promises)
      }
    }
  }

  if(esBulkStr.length) {
    esBulkStr = esBulkStr.slice(0, -1)
    log.debug('esBulkStr', esBulkStr)
    const res = await esBulk(`[${esBulkStr}]`)
    if(!res) {
      console.error('bulk api failure! terminate', res)
    } else {
      // log.debug(res);
    }
  }
}

const sendEmail = async ({ name, email }, clickUrls) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORDs,
    },
  })
  let htmlText = ''
  let text = ''
  clickUrls.forEach((url) => {
    text += `https://nalula.com${url}\n`
    htmlText += `<p><a href='https://nalula.com${url}'>https://nalula.com${url}</a></p>`
  })
  const textBody = `FROM: Nalula EMAIL: hello@nalula.com MESSAGE: Aloha ${name},\n\nSome of your saved searches have new properties! View the new listings at:\n\n${text}\n\nIf you have questions about the area or a specific property, please reach out to one of the agents that is an expert for your unique search as shown on our agent leaderboard.\n\nIf you would like to make an offer on a specific property, please consider using a Nalula Preferred agent to get a tremendous rebate. Details can be found on each property detail page.\n\nBest regards,\nThe Nalula Team\n\n\n\n\n\n251 Little Falls Drive Wilmington, DE 19808\nPrivacy Policy: https://nalula.com/privacy\nUnsubscribe: Please visit the link to view your saved property and unsave the search`
  const htmlBody = `<p>Aloha ${name},</p><p>Some of your saved searches have a new property! View the new listings at:</p>${htmlText}<p>If you have questions about the area or a specific property, please reach out to one of the agents that is an expert for your unique search as shown on our agent leaderboard.</p><p>If you would like to make an offer on a specific property, please consider using a Nalula Preferred agent to get a tremendous rebate. Details can be found on each property detail page.</p><p>Best regards,<br />The Nalula Team</p><p style='margin-top: 100px'><small>251 Little Falls Drive Wilmington, DE 19808<br /><a href='https://nalula.com/privacy'>Privacy Policy</a><br />Unsubscribe: Please visit the link to view your saved property and unsave the search</small></p>`
  const mail = {
    from: 'Nalula <hello@nalula.com>',
    to: `${name} <${email}>`,
    subject: 'A new property matches your saved search',
    text: textBody,
    html: htmlBody,
  }
  const res = await transporter.sendMail(mail)
  return res
}

const repErr = ({ e, operation, extra }) => {
  reportError({
    e,
    tags: {
      service: 'Searches Worker',
      operation,
    },
    extra,
  })
}

export default {
  name: 'Search Updates',
  message: 'Sending Notification of Changes to Saved Searches.',
  schedule: '1 8,20 * * *', // 8:01 am, 8:01pm
  worker,
  immediate: true,
  enabled: true,
}

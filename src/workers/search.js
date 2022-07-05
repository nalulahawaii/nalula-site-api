import {
  esBulk,
  esClient,
} from 'src/services/elasticsearch'
import esb from 'elastic-builder'
import { DateTime } from 'luxon'
import User from 'src/db/mongo/models/user.mongo'
import Search from 'src/db/mongo/models/search.mongo'
import Message from 'src/db/mongo/models/message.mongo'
import { reportError } from 'src/util/error-handling'
import { newLogger } from 'src/services/logging'
import _ from 'lodash'
import {
  getNowISO,
  luxonDateTimeToISO,
} from 'src/util/date'
import { logValDetailed } from 'src/util/debug'
import { sendEmail } from 'src/services/email'

const log = newLogger('Searches Worker')

const queryAsJSON = esb
  .requestBodySearch()
  .size(1000)
  .query(esb.termQuery('changed', true))
  .toJSON()

const notificationFrequency = process.env.SAVED_SEARCH_TEST_MODE === 'true'
  ? { minutes: 15 }
  : { hours: 12 }

const getChangesHits = async () => {
  try {
    const results = await esClient.search({
      index: 'listing-query-000001',
      body: queryAsJSON,
    })
    const hits = results?.body?.hits?.hits || []
    log.debug(`${hits.length} hits`)
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
  log.debug('hits detail', logValDetailed(hits))
  const userIds = new Set()
  const searchIds = hits.map(({
    _id,
    _source: { user_id },
  }) => {
    userIds.add(user_id)
    return _id
  })
  if(_.isEmpty(searchIds)) return

  log.debug('IDs of changed searches:', searchIds)
  log.debug('userIds of changed searches', userIds)

  if(_.isEmpty(userIds)) return

  const users = await User.findById(userIds)
  if(_.isEmpty(users)) {
    log.debug('no current users')
    return
  }

  log.debug(`Changes found for ${_.size(users)} current users' saved searches`)

  // Find saved searches that are due for notifications:
  const timeStamp = luxonDateTimeToISO(DateTime.now().minus(notificationFrequency))
  const searches = await Search.find({
    $and: [
      { _id: searchIds },
      {
        $or: [
          {
            notifyDate: { $lte: timeStamp },
          },
          { notifyDate: null },
        ],
      },
    ],
  })
  if(!_.isEmpty(searches)) {
    log.debug('No notifications are due for the saved searches')
    return
  }

  log.debug(`${_.size(searches)} saved searches are due for notifications`)

  // Update saved search notification dates and mark as unchanged:
  let esBulkStr = ''
  _.forEach(searches, search => {
    // eslint-disable-next-line no-param-reassign
    search.notifyDate = getNowISO()
    esBulkStr += `{ "update" : {"_id" : "${search._id}", "_index" : "listing-query-000001"} },{ "doc" : {"changed" : "false"} },`
    search.save()
  })

  const userSearches = _.groupBy(searches, 'creator._id')
  log.debug('saved searches grouped by user', userSearches)
  const promises = users.map(async (user) => {
    const mySearches = userSearches[user._id]
    if(!mySearches) return
    const emailClickUrls = []
    const messageClickUrls = []
    mySearches.forEach(({ isInternalNotify, isEmailNotify, clickUrl }) => {
      if(isEmailNotify) emailClickUrls.push(clickUrl)
      if(isInternalNotify) messageClickUrls.push(clickUrl)
    })
    log.debug('emailClickUrls', emailClickUrls)
    if(emailClickUrls.length) await sendNotifications(user, emailClickUrls)
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
  })
  await Promise.all(promises)

  if(_.isEmpty(esBulkStr)) return
  esBulkStr = esBulkStr.slice(0, -1)
  log.debug('esBulkStr', esBulkStr)
  const res = await esBulk(`[${esBulkStr}]`)
  if(!res) repErr({
    e: 'no response from API',
    operation: 'update saved searches index',
  })
}

/**
 * Send email and/or SMS notifications of new properties in saved searches.
 *
 * @param {string} name
 * @param {string} email
 * @param {string[]} clickUrls
 * @returns {Promise<[ClientResponse, {}]>}
 */
const sendNotifications = ({ name, email }, clickUrls) => {
  let htmlText = ''
  let text = ''
  clickUrls.forEach((url) => {
    text += `https://nalula.com${url}\n`
    htmlText += `<p><a href='https://nalula.com${url}'>https://nalula.com${url}</a></p>`
  })
  const textBody = `FROM: Nalula EMAIL: hello@nalula.com MESSAGE: Aloha ${name},\n\nSome of your saved searches have new properties! View the new listings at:\n\n${text}\n\nIf you have questions about the area or a specific property, please reach out to one of the agents that is an expert for your unique search as shown on our agent leaderboard.\n\nIf you would like to make an offer on a specific property, please consider using a Nalula Preferred agent to get a tremendous rebate. Details can be found on each property detail page.\n\nBest regards,\nThe Nalula Team\n\n\n\n\n\n251 Little Falls Drive Wilmington, DE 19808\nPrivacy Policy: https://nalula.com/privacy\nUnsubscribe: Please visit the link to view your saved property and unsave the search`
  const htmlBody = `<p>Aloha ${name},</p><p>Some of your saved searches have a new property! View the new listings at:</p>${htmlText}<p>If you have questions about the area or a specific property, please reach out to one of the agents that is an expert for your unique search as shown on our agent leaderboard.</p><p>If you would like to make an offer on a specific property, please consider using a Nalula Preferred agent to get a tremendous rebate. Details can be found on each property detail page.</p><p>Best regards,<br />The Nalula Team</p><p style='margin-top: 100px'><small>251 Little Falls Drive Wilmington, DE 19808<br /><a href='https://nalula.com/privacy'>Privacy Policy</a><br />Unsubscribe: Please visit the link to view your saved property and unsave the search</small></p>`
  return sendEmail({ name, email, textBody, htmlBody })
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
  name: 'Search Change Notifications',
  message: 'Notifying Users of Changes to Saved Searches.',
  schedule: '1 8,20 * * *', // 8:01 am, 8:01pm
  worker,
  immediate: true,
  enabled: true,
}

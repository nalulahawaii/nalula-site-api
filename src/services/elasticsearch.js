import { Client } from '@elastic/elasticsearch'
import { newLogger } from 'src/services/logging'
import { reportError } from 'src/util/error-handling'
import { logValDetailed } from 'src/util/debug'

const log = newLogger('ElasticSearch Client')

export const esClient = new Client({
  node: process.env.ELASTIC_SEARCH_URI,
})

export const esBulk = async (str) => {
  let json
  try {
    json = JSON.parse(str)
  } catch (e) {
    log.error(`Error parsing JSON for esBulk: "${str}"`, e)
    return false
  }
  try {
    const res = await esClient.bulk({
      body: json,
      refresh: 'wait_for',
    })
    if(res.statusCode !== 200) {
      repErr({
        e: res.statusMessage,
        operation: 'bulk',
        extra: {
          json,
        },
      })
      return false
    }
    log.debug(logValDetailed(res))

  } catch (e) {
    repErr({
      e,
      operation: 'bulk',
      extra: {
        json,
      },
    })
  }
  return true
}

const repErr = ({ e, operation, extra }) => {
  reportError({
    e,
    tags: {
      service: 'ElasticSearch',
      operation,
    },
    extra,
  })
}

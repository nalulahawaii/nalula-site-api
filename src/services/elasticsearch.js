import { Client } from '@elastic/elasticsearch'
import { newLogger } from 'src/services/logging'

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
    log.debug('running bulk api update with', json)
    const res = await esClient.bulk({
      body: json,
      refresh: 'wait_for',
    })
    if(res.statusCode !== 200) {
      log.error('bulk api error', res)
      return false
    }
  } catch (e) {
    log.error('bulk api error, e')
  }
  return true
}

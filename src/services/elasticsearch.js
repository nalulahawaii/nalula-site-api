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
  if(!esClient) {
    log.error('no client provided!')
    return false
  }
  const res = await esClient.bulk({
    body: json,
    refresh: 'wait_for',
  })
  if(res.statusCode !== 200) {
    log.error('bulk api error', res)
    return false
  }
  return true
}

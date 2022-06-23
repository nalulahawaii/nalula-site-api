import { Client } from '@elastic/elasticsearch'

export const esClient = new Client({
    node: process.env.ELASTIC_SEARCH_URL,
})

export const esBulk = async (str) => {
    let json
    try {
        json = JSON.parse(str)
    } catch (e) {
        console.error(e, str)
        return false
    }
    if (!esClient) {
        console.error('no client provided!')
        return false
    }
    const res = await esClient.bulk({
        body: json,
        refresh: 'wait_for',
    })
    if (res.statusCode !== 200) {
        console.error('bulk api error', res)
        return false
    }
    return true
}

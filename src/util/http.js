// TODO: replace with 'got' templates
const addCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  )
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, PUT, POST, DELETE, HEAD, OPTIONS',
  )
}
export const sendJson = (res, results) => {
  addCorsHeaders(res)
  res.status(200).json(results)
}
export const sendError = (res, results) => {
  addCorsHeaders(res)
  res.status(400).error(results)
}

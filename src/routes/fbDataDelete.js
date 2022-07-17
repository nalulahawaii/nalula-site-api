import { sendJson } from 'util/http'
import crypto from 'crypto'

const router = require('express').Router()

router.post('/', async (req, res) => {
  const {
    body: { signed_request },
  } = req

  const { user_id } = parseSignedRequest(
    signed_request,
    '3995f58bf9f4c7bf03e70678610ed7af',
  )

  // Start data deletion
  // const users = await User.findByIdAndDelete(id);

  const statusUrl = 'https://www.<your_website>.com/deletion?id=abc123' // URL to track the deletion
  const confirmationCode = 'abc123' // unique code for the deletion request

  sendJson(res, {
    url: statusUrl,
    confirmation_code: confirmationCode,
  })
})

const base64decode = (data) => {
  while (data.length % 4 !== 0) {
    data += '='
  }
  data = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(data, 'base64').toString('utf-8')
}

const parseSignedRequest = (signedRequest, secret) => {
  const encoded_data = signedRequest.split('.', 2)
  const sig = encoded_data[0]
  const json = base64decode(encoded_data[1])
  const data = JSON.parse(json)
  if(!data.algorithm || data.algorithm.toUpperCase() != 'HMAC-SHA256') {
    throw Error(
      `Unknown algorithm: ${data.algorithm}. Expected HMAC-SHA256`,
    )
  }
  const expected_sig = crypto
    .createHmac('sha256', secret)
    .update(encoded_data[1])
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace('=', '')
  if(sig !== expected_sig) {
    throw Error(`Invalid signature: ${sig}. Expected ${expected_sig}`)
  }
  return data
}
export default router

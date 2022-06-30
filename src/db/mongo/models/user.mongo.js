import {
  model,
  Schema,
} from 'mongoose'

const schema = new Schema({
  email: String,
  email_verified: String,
  family_name: String,
  given_name: String,
  locale: String,
  name: String,
  nickname: String,
  picture: String,
  sub: String,
  loginCount: Number,
})

schema.index({ sub: 1 })

export default model('User', schema)
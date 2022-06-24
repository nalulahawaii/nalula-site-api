import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util'

const schema = Schema(
  {
    senderId: getMongooseRef('User'),
    receiverId: getMongooseRef('User'),
    text: String,
    viewDate: Date,
    data: String,
  },
  { timestamps: true },
)

export default model('Message', schema)

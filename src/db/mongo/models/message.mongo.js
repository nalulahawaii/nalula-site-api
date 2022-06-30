import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util/mongoose'

const schema = Schema(
  {
    sender: getMongooseRef('User'),
    receiver: getMongooseRef('User', true),
    text: String,
    viewDate: Date,
    data: String,
  },
  { timestamps: true },
)

schema.index({ viewDate: 1 })
export default model('Message', schema)

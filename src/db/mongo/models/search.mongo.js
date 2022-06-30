import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util/mongoose'

const schema = Schema(
  {
    isInternalNotify: Boolean,
    isEmailNotify: Boolean,
    clickUrl: String,
    clickText: String,
    creator: getMongooseRef('User'),
    notifyDate: Date,
  },
  { timestamps: true },
)

export default model('Search', schema)

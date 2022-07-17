import { model, Schema } from 'mongoose'
import { getMongooseRef } from 'util/mongoose'

const schema = Schema(
  {
    isInternalNotify: Boolean,
    isEmailNotify: Boolean,
    clickUrl: String,
    clickText: String,
    creator: getMongooseRef('User', true),
    notifyDate: Date,
  },
  { timestamps: true },
)

schema.index({ notifyDate: 1 })
schema.index({ clickUrl: 1 })
export default model('Search', schema)

import { model, Schema } from 'mongoose'
import { getMongooseRef } from 'util/mongoose'

const schema = new Schema(
  {
    creator: getMongooseRef('User', true),
    listingId: String,
  },
  { timestamps: true },
)

schema.index({ listingId: 1 })

export default model('Favorite', schema)

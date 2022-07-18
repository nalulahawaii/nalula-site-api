import { model, Schema } from 'mongoose'
import { getMongooseRef } from 'util/mongoose'

const schema = new Schema(
  {
    creator: getMongooseRef('User', true),
    group: getMongooseRef('FavoriteGroup', true),
    listingId: String,
  },
  { timestamps: true },
)

schema.index({ listingId: 1 })

export default model('Favorite', schema)

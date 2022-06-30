import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util/mongoose'

const schema = new Schema(
  {
    creator: getMongooseRef('User'),
    group: getMongooseRef('FavoriteGroup'),
    listingId: String,
  },
  { timestamps: true },
)

schema.index({ creator: 1 })
schema.index({ group: 1, listing: 1 })

export default model('Favorite', schema)

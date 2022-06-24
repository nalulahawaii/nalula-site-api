import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util'

const schema = new Schema(
  {
    creatorId: getMongooseRef('User'),
    groupId: getMongooseRef('FavoriteGroup'),
    listingId: String,
  },
  { timestamps: true },
)
export default model('Favorite', schema)

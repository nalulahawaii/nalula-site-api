import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util'

const schema = new Schema(
  {
    creatorId: getMongooseRef('User'),
    name: String,
    isPrivate: Boolean,
  },
  { timestamps: true },
)

export default model('FavoriteGroup', schema)

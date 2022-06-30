import {
  model,
  Schema,
} from 'mongoose'
import { getMongooseRef } from 'src/util/mongoose'

const schema = new Schema(
  {
    creator: getMongooseRef('User'),
    name: String,
    isPrivate: Boolean,
  },
  { timestamps: true },
)

export default model('FavoriteGroup', schema)

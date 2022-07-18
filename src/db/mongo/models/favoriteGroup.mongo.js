import { model, Schema } from 'mongoose'
import { getMongooseRef } from 'util/mongoose'

const schema = new Schema(
  {
    creator: getMongooseRef('User'),
    name: String,
    isPrivate: Boolean,
  },
  { timestamps: true },
)

schema.index({ creator: 1 })
export default model('FavoriteGroup', schema, 'favorite-groups')

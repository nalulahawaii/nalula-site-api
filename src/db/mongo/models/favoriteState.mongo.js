import { model, Schema } from 'mongoose'

const schema = new Schema(
  {
    listingId: String,
    state: Object,
  },
  { timestamps: true },
)

schema.index({ listingId: 1 })

export default model('FavoriteState', schema, 'favorite-state')

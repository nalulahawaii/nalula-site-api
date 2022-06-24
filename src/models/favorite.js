import mongoose from 'mongoose'
import FavoriteSchema from 'src/schema/favorite'

export default mongoose.model('Favorite', FavoriteSchema)

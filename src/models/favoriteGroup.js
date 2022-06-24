import mongoose from 'mongoose'
import FavoriteGroupSchema from 'src/schema/favoriteGroup'

export default mongoose.model('FavoriteGroup', FavoriteGroupSchema)

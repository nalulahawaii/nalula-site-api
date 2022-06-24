import mongoose from 'mongoose'
import SearchSchema from 'src/schema/search'

export default mongoose.model('Search', SearchSchema)

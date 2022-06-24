import mongoose from 'mongoose'
import UserSchema from 'src/schema/user'

export default mongoose.model('User', UserSchema)

import mongoose from 'mongoose'
import MessageSchema from 'src/schema/message'

export default mongoose.model('Message', MessageSchema)

import { Schema } from 'mongoose'

export const getMongooseRef = modelName => ({
  type: Schema.Types.ObjectId,
  ref: modelName,
})

import { Schema } from 'mongoose'

export const getMongooseRef = (modelName, withIndex = false) => ({
  type: Schema.Types.ObjectId,
  ref: modelName,
  index: withIndex,
})

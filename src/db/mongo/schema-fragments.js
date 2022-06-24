import { Schema } from 'mongoose'
import Joi from 'joi'

export const userRef = Joi.string().min(24)

export const calendlyInviteeRef = {
  type: Schema.Types.ObjectId,
  ref: 'CalendlyInvitee',
}

export const addressComponents = {
  street1: String,
  street2: String,
  street3: String,
  city: String,
  state: String,
  zip: String,
  country: String, // alpha2 code
  description: String, // full address on one line
}

export const nameComponents = {
  first: String,
  middleInitial: String,
  last: String,
  suffix: String,
}

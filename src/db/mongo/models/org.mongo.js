import { model, Schema } from 'mongoose'

const orgSchema = new Schema(
  {
    id: String,
    name: String,
    logo: String,
    welcomeMessage: String,
    userConfig: Object,
    genders: [Object],
    divisions: [Object],
    insurers: [Object],
    visitConfigs: Object,
    intakeFormConfig: Object,
    proofCardConfigs: Object,
    adminConfig: Object,
    auth: Object,
    provider: Object,
  },
  { timestamps: true },
)

orgSchema.index({ id: 1 }, { unique: true })
export const OrgModel = model('Org', orgSchema, 'org')

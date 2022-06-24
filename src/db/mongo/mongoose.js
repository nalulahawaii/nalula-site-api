import glob from 'glob'
import mongoose from 'mongoose'
import path from 'path'
import { config } from '../../config'

const log = require('log4js').getLogger('Db')

log.level = 'info'

const root = process.cwd()
const MONGOOSE_SCHEMA_PATTERN = config.env === 'development' ? 'src/**/*.mongo.js' : 'dist/**/*.mongo.js'

class Db {
  static async connect (mongoUri = config.mongodb.uri) {
    log.info('Connecting to Mongo Database')
    log.info(`Mongoose version ${mongoose.version}`)

    await mongoose.connect(mongoUri, {})

    const modelFiles = glob.sync(MONGOOSE_SCHEMA_PATTERN)

    modelFiles.forEach((file) => {
      const filePath = path.join(root, '/', file)

      // eslint-disable-next-line
      require(filePath)
    })

    log.info(`Loaded ${modelFiles.length} mongoose model files.`)

    log.info('Connected to Mongo Database')
  }

  static close () {
    mongoose.connection.close()
  }
}

export { Db }

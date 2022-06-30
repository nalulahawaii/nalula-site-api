import glob from 'glob'
import mongoose from 'mongoose'
import path from 'path'

const log = require('log4js').getLogger('Db')

log.level = 'info'

const root = process.cwd()

class Db {
  static async connect (mongoUri = process.env.MONGODB_URI) {
    log.info('Connecting to Mongo Database')
    log.info(`Mongoose Version ${mongoose.version}`)

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })

    const modelFiles = glob.sync('src/**/*.mongo.js')

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

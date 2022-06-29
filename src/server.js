import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import startCrons from 'src/crons/cron'
import bodyparser from 'body-parser'
import compression from 'compression'
import 'core-js/stable'
import cors from 'cors'
import errorMiddleware from 'error-middleware'
import path from 'path'
import * as Sentry from '@sentry/node'
import { RewriteFrames as RewriteFramesIntegration } from '@sentry/integrations'
import 'regenerator-runtime/runtime'
import passport from 'passport'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passportCustom from 'passport-custom'
import { Db } from './db/mongo/mongoose'
import { twilioPassportVerify } from './services/twilio'
import { localPassportVerify } from './services/passport-local'
import api from './routes'
import { rateLimitPublic } from './middlewares/rate-limiting'
import { SESSION_COOKIE_NAME } from './config/constants'
import { getAppConfig } from './util/app-config'
import { findUserById } from './services/user/user-graph-client'

require('dotenv').config()

const app = express()

const db = mongoose.connection

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
db.on('error', console.error.bind(console, 'mongoose connection error:'))
db.once('open', console.log.bind(console, 'mongoose connected'))

app.use(require('cors')())
app.use(require('compression')())
app.use(require('response-time')())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/favoriteGroup', require('src/routes/favoriteGroup'))
app.use('/user', require('src/routes/user'))

if(app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(500).json(err.stack)
  })
} else {
  app.use(function (err, req, res, next) {
    res.status(500).json(err.message)
  })
}

app.listen(process.env.PORT || 5001, () => {
  // startCrons()
})

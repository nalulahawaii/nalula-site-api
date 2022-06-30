import express from 'express'
import bodyParser from 'body-parser'
import faveGroupRt from 'src/routes/favoriteGroup'
import userRt from 'src/routes/user'
import { newLogger } from 'src/services/logging'
import { Db } from 'src/db/mongo/mongoose'
import { initWorkers } from 'src/workers'

const log = newLogger('Server')

Db.connect().catch((err) => {
  log.error('MongoDB connection error:', err)
  process.exit(1)
})

const app = express()

app.use(require('cors')())
app.use(require('compression')())
app.use(require('response-time')())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/favoriteGroup', faveGroupRt)
app.use('/user', userRt)

if(app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(500).json(err.stack)
  })
} else {
  app.use((err, req, res, next) => {
    res.status(500).json(err.message)
  })
}

app.listen(process.env.PORT || 5001, () => {
  log.info('Started')
  initWorkers()
})

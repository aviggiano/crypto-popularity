const debug = require('debug')('crypto-popularity:app')
const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const helmet = require('helmet')

const config = require('./config/index')
const reddit = require('./routes/reddit')
const definitions = require('./routes/definitions')

const app = express()

app.use(helmet())
app.use(bodyParser.json({limit: '2mb'}))
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  parameterLimit: 100000,
  limit: 1024 * 1024 * 10,
  extended: true
}))

app.listen(config.port, config.ip, () => {
  debug('app running on port', config.port)
})

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.get('/:version/reddit', reddit)
app.get('/:version/definitions', definitions)
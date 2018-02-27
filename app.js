var express = require('express')
var path = require('path')
// var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var mongoose = require('mongoose')
var properties = require('nconf')

// Then load properties from a designated file.
properties.file({file: 'config/properties.json'})

// Establish connection to Mongodb
var mongoDB = properties.get('mongodb:url')
mongoose.connect(mongoDB, {
  useMongoClient: true
})
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise
// Get the default connection
var db = mongoose.connection

var lipaNaMpesa = require('./routes/api/lipanampesa/lipaNaMPesa')
var lipaNaMpesaQuery = require('./routes/api/lipanampesa/lipaNaMPesaQuery')
var c2b = require('./routes/api/validationConfirmation/urlRegistration')
var c2bValidation = require('./routes/api/validationConfirmation/c2bValidation')
var c2bConfirmation = require('./routes/api/validationConfirmation/c2bConfirmation')
var index = require('./routes/index')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', index)

// STK PUSH
app.use('/stkpush', lipaNaMpesa)
app.use('/stkpush/query', lipaNaMpesaQuery)

//C2B CONFIRMATION & VALIDATION
app.use('/c2b', c2b)
app.use('/c2b/validate', c2bValidation)
app.use('/c2b/confirm', c2bConfirmation)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// Include properties in export
app.properties = properties
app.db = db

module.exports = app

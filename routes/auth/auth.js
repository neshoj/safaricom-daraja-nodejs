var moment = require('moment')
var request = require('request')
const STK_PUSH = 'STK-PUSH'
var TOKEN_INVALIDITY_WINDOW = 240
var GENERIC_SERVER_ERROR_CODE = '01'

// Authentication model
var TokenModel = require('./tokenModel')
var properties = require('nconf')

var mpesaFunctions = require('../helpers/mpesaFunctions')
// Then load properties from a designated file.
properties.file({file: 'config/properties.json'})

var fetchToken = function (req, res, next) {
  if (req.status) {
    var serviceName = req.body.service
    TokenModel.findOne({})
            .where('service').equals(serviceName)
            .exec(function (err, records) {
              if (!err) {
                if (records) {
                        //    Record exists : update
                  if (isTokenValid(records)) {
                    console.log('Token is still valid: ' + serviceName)
                    req.transactionToken = records.accessToken
                    next()
                  } else {
                    console.log('Token is invalid: ' + serviceName)
                            // Token is invalid, resetting
                    setNewToken(req, res, serviceName, false, next)
                  }
                } else {
                        //    Record does not exist: Create
                  console.log('Record does not exist: ' + serviceName)
                  setNewToken(req, res, serviceName, true, next)
                }
              } else {
                req.status = false
                req.code = GENERIC_SERVER_ERROR_CODE
                next()
              }
            })
  } // Initial request processing
}

/**
 * Check token validity. Token validity window is set to 240 seconds
 * @param service tokenObject
 */
var isTokenValid = function (service) {
  var tokenAge = moment.duration(moment(new Date()).diff(service.lastUpdated)).asSeconds() + TOKEN_INVALIDITY_WINDOW
  return (tokenAge < service.timeout)
}

/**
 * Create new instance or update existing token instance
 * @param req
 * @param res
 * @param serviceName
 * @param newInstance
 * @param next
 */
var setNewToken = function (req, res, serviceName, newInstance, next) {
  var consumerKey = 'YOUR_APP_CONSUMER_KEY'
  var consumerSecret = 'YOUR_APP_CONSUMER_SECRET'
  var token = {}
  var url = properties.get('auth:url')
    // Load consumer keys and secrets for each service
  switch (serviceName) {
    case STK_PUSH: {
      consumerKey = properties.get('lipaNaMpesa:consumerKey')
      consumerSecret = properties.get('lipaNaMpesa:consumerSecret')
      break
    }
  }
    // Combine consumer key with the secret
  var auth = 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64')

  request({url: url, headers: {'Authorization': auth}},
        function (error, response, body) {
            // Process successful token response
          var tokenResp = JSON.parse(body)

            // Check if response contains error
          if (!error || !tokenResp.errorCode) {
            var newToken = {
              lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss'),
              accessToken: tokenResp.access_token,
              timeout: tokenResp.expires_in,
              service: serviceName
            }

            if (newInstance) {
                    // Create new access token for M-Pesa service
              token = new TokenModel(
                        newToken
                    )
                    // Save service token
              token.save(function (err) {
                if (err) {
                  req = mpesaFunctions.handleError(req, 'Unable to save token. Service: ' + serviceName)
                } else {
                  req.transactionToken = token.accessToken
                }
                next()
              })
            } else {
                    // Update existing access token
              var conditions = {service: serviceName}
              var options = {multi: true}
                    // Update existing token
              TokenModel.update(conditions, newToken, options,
                        function (err, record) {
                          if (err) {
                            req = mpesaFunctions.handleError(req, 'Unable to update token. Service: ' + serviceName)
                          } else {
                            if (record) req.transactionToken = newToken.accessToken
                          }
                          next()
                        })
            }
          } else {
                // Body is empty
            req = mpesaFunctions.handleError(req, (tokenResp.errorMessage ? tokenResp.errorMessage : 'Failed Auth token processing') || error.getMessage())
            next()
          }
        })
}

module.exports = fetchToken

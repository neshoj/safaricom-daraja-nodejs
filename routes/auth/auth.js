let moment = require('moment')
let request = require('request')
const STK_PUSH = 'STK-PUSH'
let C2B_URL_REGISTRATION_SERVICE_NAME = 'C2B-URL-REGISTRATION'
let TOKEN_INVALIDITY_WINDOW = 240
let GENERIC_SERVER_ERROR_CODE = '01'

// Authentication model
let TokenModel = require('./tokenModel')
let properties = require('nconf')

let mpesaFunctions = require('../helpers/mpesaFunctions')
// Then load properties from a designated file.
properties.file({file: 'config/properties.json'})

let fetchToken = function (req, res, next) {
    console.log('Fetching token')
    let serviceName = req.body.service
    TokenModel.findOne({})
        .where('service').equals(serviceName)
        .exec(function (err, records) {
            if (!err) {
                if (records) {
                    //    Record exists : update
                    if (isTokenValid(records)) {
                        console.log('Current Token is still valid: ' + serviceName)
                        req.transactionToken = records.accessToken
                        next()
                    } else {
                        console.log('Current Token is invalid: ' + serviceName)
                        // Token is invalid, resetting
                        setNewToken(req, res, serviceName, false, next)
                    }
                } else {
                    //    Record does not exist: Create
                    console.log('Record does not exist: ' + serviceName)
                    setNewToken(req, res, serviceName, true, next)
                }
            } else {
                mpesaFunctions.handleError(res, 'Error occurred updating token', GENERIC_SERVER_ERROR_CODE)
            }
        })
}

/**
 * Check token validity. Token validity window is set to 240 seconds
 * @param service tokenObject
 */
let isTokenValid = function (service) {
    let tokenAge = moment.duration(moment(new Date()).diff(service.lastUpdated)).asSeconds() + TOKEN_INVALIDITY_WINDOW
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
let setNewToken = function (req, res, serviceName, newInstance, next) {
    let consumerKey = 'YOUR_APP_CONSUMER_KEY'
    let consumerSecret = 'YOUR_APP_CONSUMER_SECRET'
    let token = {}
    let url = properties.get('auth:url')
    // Load consumer keys and secrets for each service
    switch (serviceName) {
        case STK_PUSH: {
            consumerKey = properties.get('lipaNaMpesa:consumerKey')
            consumerSecret = properties.get('lipaNaMpesa:consumerSecret')
            break
        }
        case C2B_URL_REGISTRATION_SERVICE_NAME:{
            consumerKey = properties.get('validationConfirm:consumerKey')
            consumerSecret = properties.get('validationConfirm:consumerSecret')
            break
        }
    }
    // Combine consumer key with the secret
    let auth = 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64')

    request({url: url, headers: {'Authorization': auth}},
        function (error, response, body) {
            // Process successful token response
            let tokenResp = JSON.parse(body)

            // Check if response contains error
            if (!error || !tokenResp.errorCode) {
                let newToken = {
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
                            mpesaFunctions.handleError(res, 'Unable to save token. Service: ' + serviceName)
                        } else {
                            req.transactionToken = token.accessToken
                        }
                        next()
                    })
                } else {
                    // Update existing access token
                    let conditions = {service: serviceName}
                    let options = {multi: true}
                    // Update existing token
                    TokenModel.update(conditions, newToken, options,
                        function (err, record) {
                            if (err) {
                               mpesaFunctions.handleError(res, 'Unable to update token. Service: ' + serviceName)
                            } else {
                                if (record) {
                                    req.transactionToken = newToken.accessToken
                                }
                            }
                            next()
                        })
                }
            } else {
                // Body is empty
                mpesaFunctions.handleError(res, (tokenResp.errorMessage ? tokenResp.errorMessage : 'Failed Auth token processing') || error.getMessage(), GENERIC_SERVER_ERROR_CODE)

            }
        })
}

module.exports = fetchToken

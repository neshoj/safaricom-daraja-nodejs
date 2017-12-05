var moment = require('moment');
var request = require('request');
const STK_PUSH = 'STK-PUSH', TOKEN_INVALIDITY_WINDOW = 240;

//Mongoose model
var tokenModel = require('./tokenModel');
var properties = require('nconf');

// Then load properties from a designated file.
properties.file({file: 'config/properties.json'});

var fetchToken = function (req, res, next) {
    if (req.status) {
        var serviceName = req.body.service;
        tokenModel.findOne({})
            .where('service').equals(serviceName)
            .exec(function (err, records) {
                if (!err) {
                    if (records) {
                        //    Record exists : update
                        if (isTokenValid(records)) {
                            console.log('Token is valid: ' + serviceName);
                            req.transactionToken = records.accessToken;
                            next();
                        } else {
                            console.log('Token is invalid: ' + serviceName);
                            //Token is invalid, resetting
                            setNewToken(req, res, serviceName, false, next);
                        }
                    } else {
                        //    Record does not exist: Create
                        console.log('Record does not exist: ' + serviceName);
                        setNewToken(req, res, serviceName, true, next);
                    }
                } else {
                    req.status = false;
                    next();
                }
            });
    } // Initial request processing
};

/**
 * Check token validity. Token validity window is set to 240 seconds
 * @param service tokenObject
 */
var isTokenValid = function (service) {
    var tokenAge = moment.duration(moment(new Date()).diff(service.lastUpdated)).asSeconds() + TOKEN_INVALIDITY_WINDOW;
    return (tokenAge < service.timeout);
};

/**
 * Create new instance or update existing token instance
 * @param req
 * @param res
 * @param serviceName
 * @param newInstance
 * @param next
 */
var setNewToken = function (req, res, serviceName, newInstance, next) {
    var consumer_key = "YOUR_APP_CONSUMER_KEY", consumer_secret = "YOUR_APP_CONSUMER_SECRET";
    var token = {};
    var url = properties.get('auth:url');
    //Load consumer keys and secrets for each service
    switch (serviceName) {
        case STK_PUSH: {
            consumer_key = properties.get('lipaNaMpesa:consumerKey');
            consumer_secret = properties.get('lipaNaMpesa:consumerSecret');
            break;
        }
    }
    //Combine consumer key with the secret
    var auth = "Basic " + new Buffer(consumer_key + ":" + consumer_secret).toString("base64");
    request({url: url, headers: {"Authorization": auth}},
        function (error, response, body) {
            if (!error) {

                //Process successful token response
                var tokenResp = JSON.parse(body);
                //Check if response contains error message
                if (!tokenResp.errorCode) {
                    var update = {
                        lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss'),
                        accessToken: tokenResp.access_token,
                        timeout: tokenResp.expires_in,
                        service: serviceName
                    };
                    if (newInstance) {
                        //Create new access token for M-Pesa service
                        token = new tokenModel(
                            update
                        );
                        //Save service token
                        token.save(function (err) {
                            if (err) {
                                req.status = false;
                                req.statusMessage = 'Unable to save token. Service: ' + serviceName;
                            } else {
                                req.transactionToken = token.accessToken;
                            }
                            next();
                        });
                    } else {
                        //Update existing access token
                        var conditions = {service: serviceName},
                            update,
                            options = {multi: true};
                        //Update existing token
                        tokenModel.update(conditions, update, options,
                            function (err, record) {
                                if (err) {
                                    req.status = false;
                                    req.statusMessage = 'Unable to update token. Service: ' + serviceName;
                                } else {
                                    if (record) req.transactionToken = update.accessToken;
                                }
                                next();
                            })
                    }
                } else {
                    req.status = false;
                    req.statusMessage = tokenResp.errorMessage ? tokenResp.errorMessage : 'Failed Auth token processing';
                }
            } else {
                //Body is empty
                req.status = false;
                req.statusMessage = error.getMessage();
                next();
            }
        });
};

module.exports = fetchToken;

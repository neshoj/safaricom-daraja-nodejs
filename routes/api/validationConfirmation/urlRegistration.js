var express = require('express')
var c2bRegistrationRouter = express.Router()
var moment = require('moment')

var auth = require('../../auth/auth')
var mpesaFunctions = require('../../helpers/mpesaFunctions')
// Then load properties from a designated file.
var properties = require('nconf')
properties.file({file: 'config/properties.json'})



var callbackURLModel = require('./c2bCallbackUrlModel')

/**
 * Save merchant call backs to database
 * @param req
 * @param res
 * @param next
 */
function registerMerchantCallBackUrl(req, res, next) {
if(!req.body){

}

    next();
}

/**
 * Save API request to
 * @param req
 * @param res
 * @param next
 */
function registerAPICallBackUrl(req, res, next) {
    next();
}

c2bRegistrationRouter.post('/register',
    registerMerchantCallBackUrl,
    registerAPICallBackUrl,
    function (req, res, next) {

        res.json({
            status: '00',
            message: 'Url Registered successfully'
        });
    });


module.exports = c2bRegistrationRouter

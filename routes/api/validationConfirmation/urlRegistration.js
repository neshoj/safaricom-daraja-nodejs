var express = require('express')
var c2bRegistrationRouter = express.Router()
var moment = require('moment')

var auth = require('../../auth/auth')
var mpesaFunctions = require('../../helpers/mpesaFunctions')
const GENERIC_SERVER_ERROR_CODE = '01'

// Then load properties from a designated file.
var properties = require('nconf')
properties.file({file: 'config/properties.json'})

var CallbackURLModel = require('./c2bCallbackUrlModel')

/**
 * Save merchant call backs to database
 * @param req
 * @param res
 * @param next
 */
function registerMerchantCallBackUrl(req, res, next) {
    if (!req.body) {
        mpesaFunctions.handleError(res, 'Invalid request received', '01')
    }
    // Check initial registration
    var query = CallbackURLModel.findOne({
        shortCode: req.body.shortCode
    })

    // Execute query
    query.exec(function (err, callbackRepository) {
        // handle error
        if (err) {
            mpesaFunctions.handleError(res, 'Error fetching url registration object ' + err.message, GENERIC_SERVER_ERROR_CODE)
        }

        var newRecord = new CallbackURLModel(
            {
                shortCode: req.body.shortCode,
                merchant: {
                    confirmation: req.body.confirmationURL,
                    validation: req.body.validationURL
                },
                api: {
                    confirmation: properties.get('validationConfirm:confirmationURL'),
                    validation: properties.get('lipaNaMpesa:validationURL'),
                    registered: false
                }
            }
        )

        if (callbackRepository) {
            //    Update record
            var conditions = {
                'shortCode': req.body.shortCode
            }
            var options = {multi: true}
            CallbackURLModel.update(conditions, req.lipaNaMPesaTransaction, options,
                function (err) {
                    if (err) {
                        mpesaFunctions.handleError(res, 'Unable to update transaction ' + err.message, GENERIC_SERVER_ERROR_CODE)
                    } else {
                        next()
                    }
                })
        } else {
            //  Save new record
            newRecord.save(function (err) {
                if (err) {
                    mpesaFunctions.handleError(res, err.message, GENERIC_SERVER_ERROR_CODE)
                } else {
                    next()
                }
            })
        }

    })
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

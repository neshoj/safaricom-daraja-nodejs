var express = require('express')
var lipaNaMpesaQueryRouter = express.Router()

// Lipa Na M-pesa model
var LipaNaMpesa = require('./lipaNaMPesaTnxModel')

// Lipa Na M-pesa model
var LipaNaMpesa = require('./lipaNaMPesaTnxModel')

var auth = require('../../auth/auth')
var mpesaFunctions = require('../../helpers/mpesaFunctions')
var properties = require('nconf')

// Then load properties from a designated file.
properties.file({file: 'config/properties.json'})

const LIPA_NA_MPESA_SERVICE_NAME = 'STK-PUSH'
const GENERIC_SERVER_ERROR_CODE = '01'


function queryDBForRecord(req, res, next) {
    // Check validity of message
    if (!req.body) {
        req = mpesaFunctions.handleError(req, 'Invalid message received')
        next()
    }
    //Fetch from database
    mpesaFunctions.fetchLipaNaMpesa({
        MerchantRequestID: req.body.merchantRequestId,
        CheckoutRequestID: req.body.checkoutRequestId
    }, req, res, next)
}

function querySafaricomForRecord(req, res, next) {
    //If transaction is not found, query safaricom for result
    if (req.lipaNaMPesaTransaction) {
        req.tnxFoundLocally = true
        next()
    }

    //Query
    // next();
}

function result(req, res, next) {

    if (req.tnxFoundLocally)
        res.json({
            merchantRequestId: req.lipaNaMPesaTransaction.mpesaInitResponse.MerchantRequestID,
            checkoutRequestId: req.lipaNaMPesaTransaction.mpesaInitResponse.CheckoutRequestID,
            message: req.lipaNaMPesaTransaction.mpesaInitResponse.ResponseDescription,
            status: req.lipaNaMPesaTransaction.mpesaInitResponse.ResponseCode === '0' ? '00' : req.lipaNaMPesaTransaction.mpesaInitResponse.ResponseCode,
        });
}

lipaNaMpesaQueryRouter.post('/',
    queryDBForRecord,
    querySafaricomForRecord,
    result);


module.exports = lipaNaMpesaQueryRouter
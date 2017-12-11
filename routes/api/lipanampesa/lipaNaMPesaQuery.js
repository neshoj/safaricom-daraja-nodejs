var express = require('express')
var lipaNaMpesaQueryRouter = express.Router()
var auth = require('../../auth/auth')
var moment = require('moment')

var mpesaFunctions = require('../../helpers/mpesaFunctions')
// Then load properties from a designated file.
var properties = require('nconf')
properties.file({file: 'config/properties.json'})

const LIPA_NA_MPESA_SERVICE_NAME = 'STK-PUSH'

function queryDBForRecord(req, res, next) {
    req.body.service = LIPA_NA_MPESA_SERVICE_NAME
    // Check validity of request
    if (!req.body) {
        mpesaFunctions.handleError(res, 'Invalid message received')
    }

    // Fetch from database
    mpesaFunctions.fetchLipaNaMpesa({
        MerchantRequestID: req.body.merchantRequestId,
        CheckoutRequestID: req.body.checkoutRequestId
    }, req, res, next)
}

function confirmSourceOfTrnx(req, res, next) {
    // If transaction is not found, query safaricom for result

    if (req.lipaNaMPesaTransaction) {
        req.tnxFoundLocally = true
        next()
    } else {
        console.log('Query safaricom')
        // Query
        var BusinessShortCode = properties.get('lipaNaMpesa:shortCode')
        var timeStamp = moment().format('YYYYMMDDHHmmss')
        var rawPass = BusinessShortCode + properties.get('lipaNaMpesa:key') + timeStamp

        req.mpesaTransaction = {
            BusinessShortCode: BusinessShortCode,
            Password: Buffer.from(rawPass, 'utf8').toString('base64'),
            Timestamp: timeStamp,
            CheckoutRequestID: req.body.checkoutRequestId
        }
        console.log('Req obj created')
        // Add auth token then send to safaricom
        auth(req, res, next)
    }
}

function querySafaricomForRecord(req, res, next) {
    // Set url, AUTH token and transaction
    mpesaFunctions.sendMpesaTxnToSafaricomAPI({
        url: properties.get('lipaNaMpesa:queryRequest'),
        auth: 'Bearer ' + req.transactionToken,
        transaction: req.mpesaTransaction
    }, req, res, next)
}

function result(req, res, next) {
    if (req.transactionResp) console.log(req.transactionResp)

    if (req.tnxFoundLocally) {
        res.json({
            merchantRequestId: req.lipaNaMPesaTransaction.mpesaInitResponse.MerchantRequestID,
            checkoutRequestId: req.lipaNaMPesaTransaction.mpesaInitResponse.CheckoutRequestID,
            message: req.lipaNaMPesaTransaction.mpesaInitResponse.ResponseDescription,
            status: req.lipaNaMPesaTransaction.mpesaInitResponse.ResponseCode === '0' ? '00' : req.lipaNaMPesaTransaction.mpesaInitResponse.ResponseCode
        })
    } else {
        res.json({
            merchantRequestId: req.body.merchantRequestId,
            checkoutRequestId: req.body.checkoutRequestId,
            message: req.statusMessage,
            status: req.code
        })
    }
}

lipaNaMpesaQueryRouter.post('/',
    queryDBForRecord,
    confirmSourceOfTrnx,
    querySafaricomForRecord,
    result)

module.exports = lipaNaMpesaQueryRouter

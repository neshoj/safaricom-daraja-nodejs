var express = require('express')
var c2bValidationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')
var C2BTransaction = require('./c2bTransactionModel');
const GENERIC_SERVER_ERROR_CODE = '01'

var validateRequest = function (req, res, next) {
    if (!req.body)
        mpesaFunctions.handleError(res, 'Invalid request received', GENERIC_SERVER_ERROR_CODE)

    next();
}

var sendRequestToRemoteApplication = function (req, res, next) {

    req.validationResult = {
        status: '00',
        message: 'Account is valid',
        transactionId: '1234566'
    }

    next();
}

var saveTransaction = function (req, res, next) {
    var transaction = new C2BTransaction(
        {
            validation: req.body,
            validationResult: req.validationResult
        }
    )
//   persist transaction details
    transaction.save(function (err) {
        if (err) mpesaFunctions.handleError(req, 'Unable to save validation request.', GENERIC_SERVER_ERROR_CODE)

        console.log('Transaction saved...')
        next();
    })
}


c2bValidationRouter.post('/',
    validateRequest,
    sendRequestToRemoteApplication,
    saveTransaction,
    function (req, res, next) {
        res.json({
            ResultCode: 0,
            ResultDesc: 'Transaction processing successful',
            ThirdPartyTransID: ''
        })
    })


module.exports = c2bValidationRouter
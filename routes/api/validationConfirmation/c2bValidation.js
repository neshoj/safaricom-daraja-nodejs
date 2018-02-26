var express = require('express')
var c2bValidationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')
var C2BTransaction = require('./c2bTransactionModel');
const GENERIC_SERVER_ERROR_CODE = '01'
const VALIDATION_TRANSACTION_ACTION_TYPE = 'validate'

var validateRequest = function (req, res, next) {
    if (!req.body)
        mpesaFunctions.handleError(res, 'Invalid request received', GENERIC_SERVER_ERROR_CODE)

    mpesaFunctions.sendCallbackMpesaTxnToAPIInitiator({
        url: '',
        transaction: {
            transactionType: req.body.TransactionType,
            action: VALIDATION_TRANSACTION_ACTION_TYPE,
            phone: req.body.MSISDN,
            firstName: req.body.FirstName,
            middleName: req.body.MiddleName,
            lastName: req.body.LastName,
            amount: req.body.TransAmount,
            accountNumber: req.body.BillRefNumber,
            time: req.body.TransTime
        }
    }, req, res, next)
}


var saveTransaction = function (req, res, next) {
    var transaction = new C2BTransaction(
        {
            validation: req.body,
            validationResult: req.transactionResp
        }
    )
//   persist transaction details
    transaction.save(function (err) {
        if (err) mpesaFunctions.handleError(req, 'Unable to save validation request.', GENERIC_SERVER_ERROR_CODE)

        console.log('C2B: Validation transaction saved...')
        next();
    })
}


c2bValidationRouter.post('/',
    validateRequest,
    saveTransaction,
    function (req, res, next) {
        res.json({
            ResultCode: 0,
            ResultDesc: 'Transaction processing successful',
            ThirdPartyTransID: ''
        })
    })


module.exports = c2bValidationRouter
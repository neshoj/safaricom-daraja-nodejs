var express = require('express')
var c2bConfirmationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')
var C2BTransaction = require('./c2bTransactionModel');

const GENERIC_SERVER_ERROR_CODE = '01'



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


c2bConfirmationRouter.post('/',
    validateRequest,
    sendRequestToRemoteApplication,
    saveTransaction,
    function (req, res, next) {
        res.json({
            ResultCode: 0,
            ResultDesc: 'confirmation',
            ThirdPartyTransID: ''
        })
    })


module.exports = c2bConfirmationRouter
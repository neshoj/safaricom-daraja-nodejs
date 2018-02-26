var express = require('express')
var c2bConfirmationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')
var C2BTransaction = require('./c2bTransactionModel');
var moment = require('moment')

const GENERIC_SERVER_ERROR_CODE = '01'
const CONFIRMATION_TRANSACTION_ACTION_TYPE = 'confirma'


/**
 * Save the confirmation request to the database.
 * @param req
 * @param res
 * @param next
 */
var saveTransaction = function (req, res, next) {
//     var transaction = new C2BTransaction(
//         {
//             validation: req.body,
//             validationResult: req.validationResult
//         }
//     )
// //   persist transaction details
//     transaction.save(function (err) {
//         if (err) mpesaFunctions.handleError(req, 'Unable to save validation request.', GENERIC_SERVER_ERROR_CODE)
//
//         console.log('Transaction saved...')
        next();
    // })
}

/**
 * Fetch initial transaction from db, Send confirmation message to remote server
 * @param req
 * @param res
 * @param next
 */
function sendRequestToRemoteApplication(req, res, next) {
    //Invalid body
    if (!req.body)
        mpesaFunctions.handleError(res, 'Invalid request received', GENERIC_SERVER_ERROR_CODE)

    C2BTransaction.findOne({
        'validation.MSISDN': req.MSISDN,
        'validation.BillRefNumber': req.BillRefNumber,
        'validation.TransID': req.TransID
    }, function (err, validatedTnx) {
        if (err) return  mpesaFunctions.handleError(res, 'Transaction not found', GENERIC_SERVER_ERROR_CODE)

        console.log(req.body.initial_tnx)

        console.log('C2B Validation transaction found for %s Bill reference number %s.',
            validatedTnx.validation.MSISDN, validatedTnx.validation.BillRefNumber);

        req.body.initial_tnx = validatedTnx;

        next();

        // mpesaFunctions.sendCallbackMpesaTxnToAPIInitiator({
        //     url: '',
        //     transaction: {
        //         transactionType: req.body.TransactionType,
        //         action: CONFIRMATION_TRANSACTION_ACTION_TYPE,
        //         phone: req.body.MSISDN,
        //         firstName: req.body.FirstName,
        //         middleName: req.body.MiddleName,
        //         lastName: req.body.LastName,
        //         OrgAccountBalance: req.body.OrgAccountBalance,
        //         amount: req.body.TransAmount,
        //         accountNumber: req.body.BillRefNumber,
        //         transID: req.body.TransID,
        //         time: moment( req.body.TransTime ).format('YYYY-MM-DD HH:mm:ss')
        //     }
        // }, req, res, next)

    });


}

c2bConfirmationRouter.post('/',
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
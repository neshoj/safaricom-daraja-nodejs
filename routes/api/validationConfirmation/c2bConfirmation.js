var express = require('express')
var c2bConfirmationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')
var C2BTransaction = require('./c2bTransactionModel')
var CallbackURLModel = require('./c2bCallbackUrlModel')
var moment = require('moment')

const GENERIC_SERVER_ERROR_CODE = '01'
const CONFIRMATION_TRANSACTION_ACTION_TYPE = 'confirmation'


/**
 * Find validation request that is being confirmed by current request
 * @param req
 * @param res
 * @param next
 */
function findInitialTransaction(req, res, next) {
    //Invalid body request
    if (!req.body)
        mpesaFunctions.handleError(res, 'Invalid request received', GENERIC_SERVER_ERROR_CODE)

    C2BTransaction.findOne({
        'validation.MSISDN': req.body.MSISDN,
        'validation.BillRefNumber': req.body.BillRefNumber,
        'validation.TransID': req.body.TransID
    }, function (err, validatedTnx) {
        //Check for error
        if (err) return mpesaFunctions.handleError(res, 'Transaction not found', GENERIC_SERVER_ERROR_CODE)


        console.log('C2B Validation transaction found for %s Bill reference number %s.',
            validatedTnx.validation.MSISDN, validatedTnx.validation.BillRefNumber);
        req.body.initial_tnx = validatedTnx;
        // console.log(JSON.stringify(req.body.initial_tnx))
        next();
    });
}

/**
 * Prepare and send confirmation message to remote server
 * @param req
 * @param res
 * @param next
 */
function sendRequestToRemoteApplication(req, res, next) {
    //Prepare object
    var confirmationReq = {
        transactionType: req.body.TransactionType,
        action: CONFIRMATION_TRANSACTION_ACTION_TYPE,
        phone: req.body.MSISDN,
        firstName: req.body.FirstName,
        middleName: req.body.MiddleName,
        lastName: req.body.LastName,
        OrgAccountBalance: req.body.OrgAccountBalance,
        amount: req.body.TransAmount,
        accountNumber: req.body.BillRefNumber,
        transID: req.body.TransID,
        time: moment(moment(req.body.TransTime, "YYYYMMDDHHmmss")).format('YYYY-MM-DD HH:mm:ss')
    }

    //Find remote URL configuration from database
    CallbackURLModel.findOne({
        'shortCode': req.body.BusinessShortCode
    }, function (err, remoteEndPoints) {
        //Invalid database response
        if (!req.body)
            mpesaFunctions.handleError(res, 'Pay bill ' + req.body.BusinessShortCode + ' remote URLs not registered', GENERIC_SERVER_ERROR_CODE)

        console.log('Transaction report: ' + JSON.stringify(confirmationReq))
        console.log('Remote end points: ' + JSON.stringify(remoteEndPoints))
        //Forward to remote server
        mpesaFunctions.sendCallbackMpesaTxnToAPIInitiator({
            url: remoteEndPoints.merchant.confirmation,
            transaction: confirmationReq
        }, req, res, next)
    })
}


/**
 * Save the confirmation request to the database.
 * @param req
 * @param res
 * @param next
 */
var saveTransaction = function (req, res, next) {

    var filter = {
        'validation.MSISDN': req.body.MSISDN,
        'validation.BillRefNumber': req.body.BillRefNumber,
        'validation.TransID': req.body.TransID
    }
    console.log('Fetch initial transaction')
    C2BTransaction.update(filter, {$set: {confirmation: req.body}}, {upsert: true}, function (err) {
        if (err) mpesaFunctions.handleError(req, 'Unable to save validation request.', GENERIC_SERVER_ERROR_CODE)

        console.log('Transaction updated ')
        next();
    })

}


c2bConfirmationRouter.post('/',
    findInitialTransaction,
    sendRequestToRemoteApplication,
    saveTransaction,
    function (req, res, next) {
        //Static response as customer account is already debited
        res.json({
            ResultCode: 0,
            ResultDesc: 'Transaction confirmation successful',
            ThirdPartyTransID: ''
        })
    })


module.exports = c2bConfirmationRouter
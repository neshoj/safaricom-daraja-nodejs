var express = require('express'),
    stkPushRouter = express.Router(),
    moment = require('moment'),
    request = require('request');

//Lipa Na M-pesa model
var lipaNaMpesa = require('./lipaNaMPesaTnxModel');

var auth = require('../../auth/auth');
var properties = require('nconf');

// Then load properties from a designated file.
properties.file({file: 'config/properties.json'});

const SERVICE_NAME = 'STK-PUSH';

var bootstrapRequest = function (req, res, next) {

        req.body.service = SERVICE_NAME;
        var request = req.body;
        /****************************
         {"amount":"5","phoneNumber":"2547******","callBackURL":"http://some-url","accountReference":"123456","description":"school fees"}
         *******************************/
        if (request.amount || request.phoneNumber || request.callBackURL || request.accountReference || request.description) {
            var BusinessShortCode = properties.get('lipaNaMpesa:shortCode');
            var timeStamp = moment().format('YYYYMMDDHHmmss');
            console.log('Time stamp: ' + timeStamp);

            req.mpesaTransaction = {
                BusinessShortCode: BusinessShortCode,
                Password: new Buffer(BusinessShortCode + properties.get('lipaNaMpesa:key') + timeStamp).toString("base64"),
                Timestamp: timeStamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: request.amount,
                PartyA: request.phoneNumber,
                PartyB: BusinessShortCode,
                PhoneNumber: request.phoneNumber,
                CallBackURL: properties.get('lipaNaMpesa:callBackURL'),
                AccountReference: request.accountReference,
                TransactionDesc: request.description
            };

            console.log(' POST Req: ' + JSON.stringify(req.mpesaTransaction));

            req.status = true;
        }
        else {
            req.status = false;
            req.code = '01';
            req.statusMessage = 'Invalid request received';
        }
        next();
    }
;

/**
 * Post transaction to Mpesa
 */
function postTransaction(req, res, next) {
    if (req.status) {
        var url = properties.get('lipaNaMpesa:processRequest'),
            auth = "Bearer " + req.transactionToken;

        request(
            {
                method: 'POST',
                url: url,
                headers: {
                    "Authorization": auth
                },
                json: req.mpesaTransaction
            },
            function (error, response, body) {
                console.log('POST Resp: ' + JSON.stringify(body));
                if (!error) {
                    if (!body.errorCode) {
                        //Successful processing
                        req.transactionResp = body;
                    } else {
                        //Failed processing
                        req.status = false;
                        req.code = body.errorCode;
                        req.statusMessage = body.errorMessage;
                    }
                } else {
                    req.status = false;
                    req.code = '01';
                    req.statusMessage = error.getMessage();
                }
                next();
            }
        )
    } else {
        //Move along, transaction already failed
        next();
    }
}

function processResponse(req, res, next) {
    if (req.status) {
        //Prepare external response message
        req.merchantMsg = {
            status: req.transactionResp.ResponseCode === '0' ? '00' : req.transactionResp.ResponseCode,
            message: req.transactionResp.ResponseDescription,
            merchantRequestId: req.transactionResp.MerchantRequestID,
            checkoutRequestId: req.transactionResp.CheckoutRequestID
        };
        //Prepare persistence object
        var transaction = new lipaNaMpesa({
            request: req.body,
            mpesaInitRequest: req.mpesaTransaction,
            mpesaInitResponse: req.transactionResp
        });
        //Persist transaction object
        transaction.save(function (err) {
            if (err) {
                req.status = false;
                req.code = '01';
                req.statusMessage = 'Unable to persist lipa na mpesa transaction';
            }
            next();
        });
    } else {
        //Move along, transaction already failed
        next();
    }
}

/**
 * Use this API to initiate online payment on behalf of a customer
 */

stkPushRouter.post('/process',
    bootstrapRequest,
    auth,
    postTransaction,
    processResponse,
    function (req, res, next) {
        //Check processing status
        res.json(req.status ? req.merchantMsg : {status: '01', message: req.statusMessage});
    });

/**
 * Process callback request from safaricom
 * @param req
 * @param res
 * @param next
 */
function processCallback(req, res, next) {

}

stkPushRouter.post('/callback',
    processCallback,
    function (req, res, next) {

    });

module.exports = stkPushRouter;

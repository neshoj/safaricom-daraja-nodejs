var express = require('express');
var stkPushRouter = express.Router();
var moment = require('moment');

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
            var timeStamp = moment().format('YYYYMMDDHHSS');
            console.log('Time stamp: ' + timeStamp);

            req.lipaNaMpesa = {
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

            req.status = true;
        }
        else {
            req.status = false;
        }
        next();
    }
;


/**
 * Use this API to initiate online payment on behalf of a customer
 */

stkPushRouter.post('/process',
    bootstrapRequest,
    auth,
    function (req, res, next) {
        res.json({message: 'running authentication API success'});
    });

module.exports = stkPushRouter;

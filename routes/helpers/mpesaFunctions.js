var request = require('request');

const GENERIC_SERVER_ERROR_CODE = '01';

/**
 * Handle errors
 * @param message
 * @param next
 */
function handleError(req, message, code) {
    req.status = false;
    req.code = code || GENERIC_SERVER_ERROR_CODE;
    req.statusMessage = message;

    return req;
}

/**
 * Send all transaction requests to safaricom
 * @param txnDetails
 * @param req
 * @param res
 * @param next
 */
function sendMpesaTxnToSafaricomAPI(txnDetails, req, res, next) {
    request(
        {
            method: 'POST',
            url: txnDetails.url,
            headers: {
                "Authorization": txnDetails.auth
            },
            json: txnDetails.transaction
        },
        function (error, response, body) {
            httpResponseBodyProcessor({
                body: body,
                error: error
            }, req, res, next);
        }
    )
}

/**
 * Send requests to API initiators
 * @param txnDetails
 * @param req
 * @param res
 * @param next
 */
function sendCallbackMpesaTxnToAPIInitiator(txnDetails, req, res, next) {

    console.log('Requesting: '+ JSON.stringify(txnDetails));
    request(
        {
            method: 'POST',
            url: txnDetails.url,
            json: txnDetails.transaction
        },
        function (error, response, body) {
            httpResponseBodyProcessor({
                body: body,
                error: error
            }, req, res, next);
        }
    )
}

/**
 * Handle Http responses
 * @param responseData
 * @param req
 * @param res
 * @param next
 */
function httpResponseBodyProcessor(responseData, req, res, next) {
    if (!responseData.body.fault && !responseData.body.errorCode && !responseData.error) {
        console.log('POST Resp: ' + JSON.stringify(responseData.body));
        //Successful processing
        req.transactionResp = responseData.body;
    } else {
        console.log('Error occurred: ' + JSON.stringify(body));
        this.handleError(req, (responseData.body.fault.faultstring || responseData.body.errorMessage || responseData.error.getMessage()), (responseData.body.errorCode || GENERIC_SERVER_ERROR_CODE));
    }
    next();
}

//Export model
module.exports = {
    handleError: handleError,
    sendMpesaTxnToSafaricomAPI: sendMpesaTxnToSafaricomAPI,
    sendCallbackMpesaTxnToAPIInitiator: sendCallbackMpesaTxnToAPIInitiator
};
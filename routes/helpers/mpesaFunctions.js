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

            if (!body.fault && !body.errorCode && !error) {
                console.log('POST Resp: ' + JSON.stringify(body));
                //Successful processing
                req.transactionResp = body;
            } else {
                console.log('Error occurred: ' + JSON.stringify(body));
                req = this.handleError(req, (body.fault.faultstring || body.errorMessage || error.getMessage()), (body.errorCode || GENERIC_SERVER_ERROR_CODE));
            }
            next();
        }
    )
}

//Export model
module.exports = {
    handleError: handleError,
    sendMpesaTxnToSafaricomAPI: sendMpesaTxnToSafaricomAPI
};
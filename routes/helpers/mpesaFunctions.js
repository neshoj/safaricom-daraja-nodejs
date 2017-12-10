var request = require('request')

// Lipa Na M-pesa model
var LipaNaMpesa = require('../api/lipanampesa/lipaNaMPesaTnxModel')

const GENERIC_SERVER_ERROR_CODE = '01'

/**
 * Handle errors
 * @param message
 * @param next
 */
function handleError(req, message, code) {
    req.status = false
    req.code = code || GENERIC_SERVER_ERROR_CODE
    req.statusMessage = message

    return req
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
                'Authorization': txnDetails.auth
            },
            json: txnDetails.transaction
        },
        function (error, response, body) {
            httpResponseBodyProcessor({
                body: body,
                error: error
            }, req, res, next)
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
    console.log('Requesting: ' + JSON.stringify(txnDetails))
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
            }, req, res, next)
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

    console.log('HttpResponseBodyProcessor: '+ JSON.stringify(responseData))
    if (!responseData.body.fault && !responseData.body.errorCode && !responseData.error) {
        console.log('POST Resp: ' + JSON.stringify(responseData.body))
        // Successful processing
        req.transactionResp = responseData.body
    } else {
        console.log('Error occurred: ' + JSON.stringify(responseData.body))
        handleError(req, ( responseData.body.errorMessage || responseData.body.fault.faultstring || responseData.error.getMessage()), (responseData.body.errorCode || GENERIC_SERVER_ERROR_CODE))
    }
    next()
}

/**
 * Query database for lipaNaMpesa transaction
 * @param req
 * @param res
 * @param next
 */
function fetchLipaNaMpesaTransaction(keys, req, res, next) {
    console.log('Fetch initial transaction request...')
    // Check validity of message
    if (!req.body) {
        req = handleError(req, 'Invalid message received')
        next()
    }

    var query = LipaNaMpesa.findOne({
        'mpesaInitResponse.MerchantRequestID': keys.MerchantRequestID,
        'mpesaInitResponse.CheckoutRequestID': keys.CheckoutRequestID
    })

    // execute the query at a later time
    query.exec(function (err, lipaNaMPesaTransaction) {
        // handle error
        if (err) {
            req = handleError(req, 'Lipa Mpesa transaction not found')
            req.status = false
            next()
        } else if(!lipaNaMPesaTransaction){
            console.log('Lipa Mpesa transaction not found');
            req.status = true
            next()
        } else{

            console.log('Transaction request found...' )
            // Add transaction to req body
            req.lipaNaMPesaTransaction = lipaNaMPesaTransaction
            req.status = true
            next()
        }
    })
}

// Export model
module.exports = {
    handleError: handleError,
    sendMpesaTxnToSafaricomAPI: sendMpesaTxnToSafaricomAPI,
    sendCallbackMpesaTxnToAPIInitiator: sendCallbackMpesaTxnToAPIInitiator,
    fetchLipaNaMpesa: fetchLipaNaMpesaTransaction
}

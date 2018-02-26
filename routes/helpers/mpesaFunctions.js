var request = require('request')

// Lipa Na M-pesa model
var LipaNaMpesa = require('../api/lipanampesa/lipaNaMPesaTnxModel')

const GENERIC_SERVER_ERROR_CODE = '01'

/**
 * Handle errors
 * @param message
 * @param next
 */
function handleError(res, message, code) {

    // Transaction failed
    res.send({
        status: code || GENERIC_SERVER_ERROR_CODE,
        message: message
    });
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
    console.log('HttpResponseBodyProcessor: ' + JSON.stringify(responseData))
    if (!responseData.body.fault && !responseData.body.errorCode && !responseData.error) {
        console.log('POST Resp: ' + JSON.stringify(responseData.body))
        // Successful processing
        req.transactionResp = responseData.body
        next()
    } else {
        console.log('Error occurred: ' + JSON.stringify(responseData.body))
        handleError(res, (responseData.body.errorMessage || responseData.body.fault.faultstring || responseData.error.getMessage()), (responseData.body.errorCode || GENERIC_SERVER_ERROR_CODE))
    }
}

/**
 * Query database for lipa Na Mpesa transaction
 * @param req
 * @param res
 * @param next
 */
function fetchLipaNaMpesaTransaction(keys, req, res, next) {
    console.log('Fetch initial transaction request...')
    // Check validity of message
    if (!req.body) {
        handleError(res, 'Invalid message received')
    }

    var query = LipaNaMpesa.findOne({
        'mpesaInitResponse.MerchantRequestID': keys.MerchantRequestID,
        'mpesaInitResponse.CheckoutRequestID': keys.CheckoutRequestID
    })

    // execute the query at a later time
    query.exec(function (err, lipaNaMPesaTransaction) {
        // handle error
        if (err) {
            handleError(res, 'Lipa Mpesa transaction not found')
        } else if (!lipaNaMPesaTransaction) {
            console.log('Lipa Mpesa transaction not found')
            next()
        } else {
            console.log('Transaction request found...')
            // Add transaction to req body
            req.lipaNaMPesaTransaction = lipaNaMPesaTransaction
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

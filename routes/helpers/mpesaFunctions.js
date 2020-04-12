let request = require('request')

// Lipa Na M-pesa model
let LipaNaMpesa = require('../api/lipanampesa/lipaNaMPesaTnxModel')

const GENERIC_SERVER_ERROR_CODE = '01'

/**
 * Handle errors
 * @param res
 * @param message
 * @param code
 */
let handleError = function (res, message, code) {

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
let sendMpesaTxnToSafaricomAPI = function (txnDetails, req, res, next) {
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
let sendCallbackMpesaTxnToAPIInitiator = function (txnDetails, req, res, next) {
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
let httpResponseBodyProcessor = function (responseData, req, res, next) {
    console.log('HttpResponseBodyProcessor: ' + JSON.stringify(responseData))
    if (responseData.body) {
        if (responseData.body.ResponseCode === '0') {
            console.log('POST Resp: ' + JSON.stringify(responseData.body))
            // Successful processing
            req.transactionResp = responseData.body
            next()
        } else {
            return handleError(res, ('Invalid remote response'), (responseData.body.errorCode || GENERIC_SERVER_ERROR_CODE))
        }
    } else {
        console.log('Error occurred: ' + JSON.stringify(responseData.body))
        return handleError(res, ('Invalid remote response'), (responseData.body.errorCode || GENERIC_SERVER_ERROR_CODE))
    }
}

/**
 * Query database for lipa Na Mpesa transaction
 * @param req
 * @param res
 * @param next
 * @param keys
 */
let fetchLipaNaMpesaTransaction = function (keys, req, res, next) {
    console.log('Fetch initial transaction request...')
    // Check validity of message
    if (!req.body) {
        handleError(res, 'Invalid message received')
    }

    let query = LipaNaMpesa.findOne({
        'mpesaInitResponse.MerchantRequestID': keys.MerchantRequestID,
        'mpesaInitResponse.CheckoutRequestID': keys.CheckoutRequestID
    })

    // execute the query at a later time
    let promise = query.exec(function (err, lipaNaMPesaTransaction) {
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

let isEmpty = function (val) {
    return (!(val !== undefined && val != null && val.length > 0))
}

// Export model
module.exports = {
    isEmpty: isEmpty,
    handleError: handleError,
    sendMpesaTxnToSafaricomAPI: sendMpesaTxnToSafaricomAPI,
    sendCallbackMpesaTxnToAPIInitiator: sendCallbackMpesaTxnToAPIInitiator,
    fetchLipaNaMpesa: fetchLipaNaMpesaTransaction
}

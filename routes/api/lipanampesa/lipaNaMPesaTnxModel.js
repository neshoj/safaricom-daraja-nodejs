var mongoose = require('mongoose');

var lipaNaMpesaTransaction = new mongoose.Schema(
    {
        request: {
            amount: String,
            phoneNumber: String,
            callBackURL: String,
            accountReference: String,
            description: String
        },
        mpesaInitRequest: {
            BusinessShortCode: String,
            Password: String,
            Timestamp: String,
            TransactionType: String,
            Amount: String,
            PartyA: String,
            PartyB: String,
            PhoneNumber: String,
            CallBackURL: String,
            AccountReference: String,
            TransactionDesc: String
        },
        mpesaInitResponse: {
            MerchantRequestID: String,
            CheckoutRequestID: String,
            ResponseCode: String,
            ResponseDescription: String,
            CustomerMessage: String
        }
    }
);

// Create a model based on the schema
var lipaNaMpesaTransaction = mongoose.model('lipaNaMpesa', lipaNaMpesaTransaction);

//Export model
module.exports = lipaNaMpesaTransaction;
let mongoose = require('mongoose')

let txnRepository = new mongoose.Schema(
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
    },
    mpesaCallback: {
      stkCallback: {
        CheckoutRequestID: String,
        MerchantRequestID: String,
        ResultCode: Number,
        ResultDesc: String,
        CallbackMetadata: {
          Item: [
            {
              Name: String,
              Value: String
            }
          ]
        }
      }
    }

  }
)

// Create a model based on the schema
let lipaNaMpesaTransaction = mongoose.model('lipaNaMpesaTxn', txnRepository)

// Export model
module.exports = lipaNaMpesaTransaction

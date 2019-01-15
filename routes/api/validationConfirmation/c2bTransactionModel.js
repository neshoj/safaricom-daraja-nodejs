let mongoose = require('mongoose')

let c2bTransaction = new mongoose.Schema(
    {
        status: String,
        validation: {
            TransactionType: String,
            MSISDN: String,
            FirstName: String,
            MiddleName: String,
            LastName: String,
            TransAmount: String,
            BillRefNumber: String,
            TransTime: String,
            OrgAccountBalance: String,
            BusinessShortCode: String,
            TransID: String,
            InvoiceNumber: String
        },
        validationResult: {
            status: String,
            message: String,
            transactionId: String
        },
        confirmation: {
            TransactionType: String,
            MSISDN: String,
            FirstName: String,
            MiddleName: String,
            LastName: String,
            TransAmount: String,
            ThirdPartyTransID: String,
            TransID: String,
            BillRefNumber: String,
            TransTime: String,
            message: String,
            transactionId: String
        }
    }
)

// Create a model based on the schema
let transactionC2B = mongoose.model('c2bTxn', c2bTransaction)

// Export model
module.exports = transactionC2B

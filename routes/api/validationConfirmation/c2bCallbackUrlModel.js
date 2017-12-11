var mongoose = require('mongoose')

var callBackURLRepository = new mongoose.Schema(
    {
        shortCode: String,
        merchant: {
            confirmation: String,
            validation: String
        },
        api: {
            confirmation: String,
            validation: String,
            registered: Boolean
        }
    }
)

// Create a model based on the schema
var c2bCallbackURL = mongoose.model('c2bUrl', callBackURLRepository)

// Export model
module.exports = c2bCallbackURL

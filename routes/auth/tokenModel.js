var mongoose = require('mongoose')

var tokenRepository = new mongoose.Schema(
  {
    lastUpdated: String,
    accessToken: String,
    timeout: String,
    service: String
  }
)

// Create a model based on the schema
let TokensModel = mongoose.model('tokens', tokenRepository)

// Export model
module.exports = TokensModel

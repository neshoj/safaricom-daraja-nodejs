var express = require('express')
var c2bConfirmationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')

c2bConfirmationRouter.post('/',
    function (req, res, next) {
        res.json({
            ResultCode: 0,
            ResultDesc: 'confirmation',
            ThirdPartyTransID: ''
        })
    })


module.exports = c2bConfirmationRouter
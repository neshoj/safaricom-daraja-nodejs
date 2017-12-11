var express = require('express')
var c2bValidationRouter = express.Router()

var mpesaFunctions = require('../../helpers/mpesaFunctions')

c2bValidationRouter.post('/',
    function (req, res, next) {
        res.json({
            ResultCode: 0,
            ResultDesc: 'validation',
            ThirdPartyTransID: ''
        })
    })


module.exports = c2bValidationRouter
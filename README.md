[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# safaricom-daraja-nodejs
NodeJS based transaction processor middleware implementation for the [Daraja Safaricom M-Pesa API](https://developer.safaricom.co.ke)

**Feature list**
* [x] Auth Management
* [x] STK Push ( Online payment & Query request )
  
  ## STK Push ###
  
  Lipa na M-Pesa Online Payment API is used to initiate a M-Pesa transaction on behalf of a customer using STK Push.
  
  **Online Payment**
  
  ###### Required information ######
  1. Mpesa pay bill short code. MUST have been configured for Lipa Na Mpesa Service
  2. Lipa Na Mpesa API key e.g. bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
  3. Create a production application on [Safaricom Developer site ](https://developer.safaricom.co.ke) ensure you check 
  against Lipa na Mpesa Production under OTP confirmation window when going through the go live steps.
  
  ###### Initial Request ###### 
  
  This transaction is initiated by your application e.g. ecommerce site 
  
  End point : `http://localhost:3000/stkpush/process` change the host information based on where you have deployed the solution
  
  **Sample Request**
  
  ``` 
  {
    "amount": "5",
    "accountReference": "12344",
    "callBackURL": "http://some-url",
    "description": "school fees",
    "phoneNumber": "254708374149"
  }       
     ```
       
  **Expected Response**
  
  If the transaction is successful you will get the response `00` which indicates success anything else in the status field is a failed transaction
  
  ```
  {
      "status": "00",
      "message": "Success. Request accepted for processing",
      "merchantRequestId": "16949-1561111-1",
      "checkoutRequestId": "ws_CO_05122017091747935"
  }    
  ```
  
   ###### Callback Request ######
   
   This transaction is initiated by the mpesa gateway to your application. Transaction will be sent to the enp point you
    provided in the initial request. This request may take time to arrive after sending the initial transaction request.
   
   ```
   {
     "status": "00",
     "message": "Transaction confirmed successfully.",
     "merchantRequestId": "16949-1561111-1",
     "checkoutRequestId": "ws_CO_05122017091747935",
     "mpesaReference": "LIC86ZTXKO"
   }   
    ```
    
    Respond to this transaction with the message below
    
    ```
    {
      "status": "00",
      "message": "Success"
    }    
    ```
     
   ###### Query status Request ######
   
   Query the API service for transaction confirmation not received. The transaction queries the
   local database before querying safaricom for the transaction
   
   ```
   {     
     "merchantRequestId": "16949-1561111-1",
     "checkoutRequestId": "ws_CO_05122017091747935"
   }   
   ```
    
    The response for a successful transaction request will contain the fields below
    
    ```
    {
       "status": "00",
       "message": "Transaction confirmed successfully.",
       "merchantRequestId": "16949-1561111-1",
       "checkoutRequestId": "ws_CO_05122017091747935",
       "mpesaReference": "LIC86ZTXKO"
    }    
    ```

> __NOTE: More daraja mpesa implementation will be included__

# About the solution

The solution is built on [nodejs](https://nodejs.org/en/) by the popular [Express framework](http://expressjs.com/) backed by its own [Mongodb](https://www.mongodb.com/)


Installing Safaricom-daraja-nodejs is easy and straight-forward, but there are a few requirements you’ll need
to make sure your system has before you start.

## Requirements

You will need to install some stuff, if they are not yet installed in your machine:

* [Node.js (v4.3.2 or higher; LTS)](http://nodejs.org)
* [NPM (v3.5+; bundled with node.js installation package)](https://docs.npmjs.com/getting-started/installing-node#updating-npm)

If you've already installed the above you may need to only update **npm** to the latest version:

```bash
$ sudo npm update -g npm
```

---


## Install through Github

Best way to install this middleware is to clone it from Github

**To clone/download the boilerplate**

```bash
$ git clone https://github.com/neshoj/safaricom-daraja-nodejs.git
```

**After cloning, get into your cloned safaricom-daraja-nodejs's directory/folder**

```bash
$ cd safaricom-daraja-nodejs
```

**Install all of the projects dependencies with:**

```bash
$ npm install
```

## It's now ready to launch

Run the command `npm start` on your terminal and see that everything is all good:

```bash
$ npm start
```

## License

[The MIT License](http://opensource.org/licenses/MIT)

**DISCLAIMER:** All opinions aired in this repo are ours and do not reflect any company or organisation any contributor is involved with.

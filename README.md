[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# safaricom-daraja-nodejs
NodeJS based transaction processor middleware implementation for the [Daraja Safaricom M-Pesa API](https://developer.safaricom.co.ke)

**Feature list**
* [x] Auth Management
* [x] [STK Push  Online payment  Query request](#stk-push)
* [x] [C2B Confirmation & Validation](#c2b-payments)

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
   
  Query the API service for transaction confirmation not received. The transaction queries the local database before 
  querying safaricom for the transaction
   
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


  ## C2B Payments ##

  This API enables Paybill and Buy Goods merchants to integrate to M-Pesa and receive real time payments notifications.

   ###### Required information ######
   1. Mpesa pay bill short code. MUST have been configured for C2B payments
   2. Create a production application on [Safaricom Developer site ](https://developer.safaricom.co.ke) ensure you check
    against C2B Production under OTP confirmation window when going through the go live steps.
   3. On running the service register the service api end points to Safaricom and then you need to register the end 
   points of your application to this service. This enables it to forward requests to your merchant site when customers 
   initiate payments via STK.

   ###### Service End point registration ######

   When you run this application, you have to configure its end points using a domain name that is accessible over the
   internet. In the properties.json file enter the validation and confirmation urls on the validationURL and 
   confirmationURL keys respectively.Also, add your short code in the shortCode key.

   ```
     "shortCode": "600169",
     "confirmationURL": "https://localhost:3000/v1/payBill/confirmation",
     "validationURL": "https://localhost:3000/v1/account/validation",
   ```

   To initiate this transaction, call a put request to the end point `http://localhost:3000/c2b/register/safaricom`.
   This will initiate a request to Safaricom to register the above configured end points. On successful registration, 
   the response received will be

   **Sample Registration Success Response**

   ```
      {
        "status": "00",
        "message": "success"
      }
   ```

   ###### Merchant End Point Registration ######

   To ensure you receive transactions on your merchant site. You have to register the end points to receive validation
    and confirmation request.

   Send a POST request to the service end point `http://localhost:3000/c2b/register/merchant`

   **Sample Merchant End Point Registration Request**

   ```
      {
        "shortCode": "513833",
        "confirmationURL": "http://localhost:3000/c2b/confirm",
        "validationURL": "http://localhost:3000/c2b/validate"
      }

   ```

   **Sample Registration Success Response**

   ```
      {
        "status": "00",
        "message": "URL registration successful"
      }
   ```

   ###### Account Validation Request ######

   To ensure your customers are paying to the right account, M-Pesa has to send a confirmation request to confirm the 
   existence of an account. This request will be forwarded to the validation end point registered earlier under 
   [ Merchant End Point Registration ](#merchant-end-point-registration  )

   **Sample account validation Request**

   ```
      {
        "transactionType": "PAY BILL",
        "action": "validate",
        "phone": "25470*****",
        "firstName": "JOHN",
        "middleName": "DOE",
        "lastName": "",
        "amount": "5.00",
        "accountNumber": "DSTV12345",
        "time": "2018-02-28 20:46:29"
      }
   ```

   **Sample Account Validation Success Response**

   ```
      {
        "status": "00",
        "message": "Account validation success",
        "transactionId":"MERCHANT09822FEES"
      }
   ```

   **Sample Account Validation Failed Response**

   ```
      {
        "status": "01",
        "message": "Account provided is invalid",
        "transactionId":""
      }
   ```

   ###### Transaction Confirmation Request ######

   To confirm the customer's has deposited funds into your merchant pay bill, Safaricom initiates this transaction 
   through the service to the confirmation url initially registered. This request may take time to arrive after 
   sending the initial transaction request. This request will be forwarded to the validation end point registered earlier
    under [ Merchant End Point Registration ](#merchant-end-point-registration  )

   **Sample Confirmation Request**

   ```
   {
     "transactionType": "Pay Bill",
     "action": "confirmation",
     "phone": "254706151592",
     "firstName": "BEN",
     "middleName": "MUUO",
     "lastName": "",
     "OrgAccountBalance": "1995.00",
     "amount": "5.00",
     "accountNumber": "HRE668807",
     "transID": "MBQ9YFXP8E",
     "time": "2018-02-26 20:46:39"
   }

   ```

   **Sample Confirmation Response**

   ```
    {
      "status": "00",
      "message": "Success"
    }
   ```

  The confirmation transaction indicates the customer has been charged successfully.


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

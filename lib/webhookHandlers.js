const request = require('request');
const { handleDefault, processPostback, handleBrowseCategories} = require('./handlers');
const { addToCart, modifyCart, getUserData, storeNotifToken } = require('./helpers');
const { MODIFY_CART } = require('./messages');

const { users } = require('./cache');
 // Sends response messages via the Send API
 function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
        "id": sender_psid
        },
        "messaging_type" :'RESPONSE',
        "message": response
    }
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {

        } else {
        console.error("Unable to send message:" + err);
        }
    }); 
}
function callSendAPINotif (token, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "one_time_notif_token": token
    },
    "message": message
    }
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {

        } else {
        console.error("Unable to send message:" + err);
        }
    });
}
function firstEntity(nlp, name) {
  return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}
module.exports = {
    // Handles messages events
    handleMessage(sender_psid, received_message) {
        if(!users[sender_psid].fullname) {
          getUserData(sender_psid).then(()=>{}).catch(err => {})
        }
        // Check if the message contains text
        if (received_message.text) {   
            let { text } = received_message;
            const splitText = text.trim().toLowerCase().split(' ').filter((el) => {
              return Boolean(el.trim())
            });
            const command = splitText[0]; 
            const number = firstEntity(received_message.nlp, 'number');
            const name = firstEntity(received_message.nlp, 'contact');
            const previousPostback = users[sender_psid].previousPostback;
            if ((!number || (number && number.confidence < 0.7)) && previousPostback === 'cart' && command !=='cancel')
            {
              callSendAPI(sender_psid, {text: 'Kindly type in a valid quantity.\n Type "cancel" if you want to end this operation'});
              return;
            }
            if ((!number || (number && number.confidence < 0.7)) && previousPostback === 'change' && command !=='cancel')
            {
              callSendAPI(sender_psid, {text: 'Kindly type in a valid quantity.\n Type "cancel" if you want to end this operation'});
              return;
            }
            if ((!name || (name && name.confidence < 0.8)) 
            && (previousPostback === 'checkout'|| previousPostback === 'email') && command !== 'cancel') {
              switch(previousPostback) {
                case "checkout":
                  callSendAPI(sender_psid, {text: 'Kindly type in your full name.\n Type "cancel" if you want to end this operation'});
                  break;
                case "email":
                  callSendAPI(sender_psid, {text: 'Kindly type in your email.\n Type "cancel" if you want to end this operation'});
                  break;
              }
              return;
            }
            if ((!number || (number && number.confidence < 0.7)) && previousPostback === 'phone' && command !== 'cancel')
            {
              callSendAPI(sender_psid, 
                {text: 'Kindly type in a valid phone number with no dashes or spaces.\nType "cancel" if you want to end this operation'});
              return;
            }
            if (number && number.confidence > 0.7 
              && (previousPostback === 'phone' || previousPostback === 'cart' || previousPostback === 'change') && command !== 'cancel') {
              const value = number.value;
              if(previousPostback === 'cart' || previousPostback === 'change') {
                    const productId = users[sender_psid].productId
                    if(productId && value <= users[sender_psid].stock && value > 0) 
                    {
                        switch (previousPostback) {
                          case "cart":
                            addToCart(sender_psid, productId, value).then((resp) =>{
                              const response = {
                                  "text" : "Product Added to cart successfully"
                                }
                              const response_2 = {
                                  "attachment":{
                                    "type":"template",
                                    "payload":{
                                      "template_type":"button",
                                      "text":'What do you want to do next?',
                                      "buttons":[
                                        {
                                          "type":"postback",
                                          "title":"Continue Shopping",
                                          "payload": "categories"
                                        },
                                        {
                                          "type":"postback",
                                          "title":"Cart",
                                          "payload": "my_cart"
                                        },
                                        {
                                          "type":"postback",
                                          "title":"Checkout",
                                          "payload": "checkout"
                                        }
                                      ]
                                    }
                                  }
                              }
                              callSendAPI(sender_psid, response);
                              setTimeout(()=> callSendAPI(sender_psid, response_2), 100);
                              users[sender_psid].previousPostback = '';
                              users[sender_psid].cart+= 1;
                            }).catch(err => {
                                console.error(err);
                                callSendAPI(sender_psid, {text: 'Unable to add product to cart, please try again'});
                                users[sender_psid].previousPostback = '';
                            })
                            break;
                          case "change":
                            modifyCart(productId, value).then(result => {
                              const response = {
                                  "text" : "Item quantity modified successfully"
                              }
                              callSendAPI(sender_psid, response);
                              }).catch(err => {
                                  console.error(err);
                                  const errorResponse = {
                                      "text" : "An error occured, please try with us"
                              }
                              callSendAPI(sender_psid, errorResponse);
                            });
                            break;
                          }  
                    }
                    else{
                        callSendAPI(sender_psid, {text: 'Kindly type in a quantity not greater than the available stock'});
                    }
                  return;
              }
              if ((value && (String(value).lenghth === 11 || String(value).length === 13)) && previousPostback === 'phone') {
                users[sender_psid].phone = value;
                const response = {
                    "attachment":{
                      "type":"template",
                      "payload":{
                        "template_type":"button",
                        "text":'Click the \'Checkout\' button below to proceed to checkout page',
                        "buttons":[
                          {
                            "type":"web_url",
                            "url":`https://sheltered-headland-16417.herokuapp.com/checkout?sender_psid=${sender_psid}`,
                            "title":"Checkout",
                            "webview_height_ratio": "full"
                          }
                        ]
                      }
                    }
                }
                callSendAPI(sender_psid, response);
                users[sender_psid].previousPostback = '';
                return;
              }
              else {
                callSendAPI(sender_psid, {text: 'Kindly type in a valid phone number.\n Type "cancel" if you want to end this operation'});
                return;
              }
            }
            if ((name && name.confidence > 0.8) 
            && (previousPostback === 'checkout' || previousPostback === 'email') && command !== 'cancel') {
              let value = name.value;
              switch (previousPostback) {
                case "checkout":
                  users[sender_psid].fullname = value;
                  users[sender_psid].previousPostback = 'email';
                  callSendAPI(sender_psid, 
                    {text: 'Kindly, type in a your email address.\nIt will be used to send your transaction receipt to you'});
                  break;
                case "email":
                  users[sender_psid].email = value;
                  users[sender_psid].previousPostback = 'phone';
                  callSendAPI(sender_psid, 
                    {text: 'Kindly, type in a your phone number with the country code(e.g 2348175568449, 15552346784), no dashes or spaces between the numbers.\n Only US and Nigerian numbers supported at this time.\n Type "cancel" if you want to end this operation'});
                  break;
              }
              return;
            }
            // Create the payload for a basic text message
            const errorResp = {
              "text" : "An error occured on our end, please bear with us"
            }
            
            users[sender_psid].previousCommand = command;
            switch (command) {
              case "browse":
                handleBrowseCategories(splitText.slice(1))
                .then(responses => ( responses.forEach( response => (callSendAPI(sender_psid, response)))))
                .catch(response => (callSendAPI(sender_psid, response)))
                break;
              case "cancel":
                callSendAPI(sender_psid, {text:'Operation cancelled'});
                users[sender_psid].previousCommand = '';
                users[sender_psid].previousPostback = '';
                break;
              default:
                  handleDefault(command)
                  .then((responses) =>{
                    responses.forEach( response => (callSendAPI(sender_psid, response)))
                  })
                  .catch(err=> {
                    console.error(err)
                    callSendAPI(sender_psid, errorResp)
                  });
                break;
            }
          }  
        
        // Sends the response message
    },

    // Handles messaging_postbacks events
    handlePostback(sender_psid, received_postback) {
        if(!users[sender_psid].fullname) {
          getUserData(sender_psid).then(()=>{}).catch(err => {})
        }
        // Get the payload for the postback
        let payload = received_postback.payload.trim().toLowerCase();

        // Set the response based on the postback payload
        processPostback(sender_psid, payload).then(responses => {
          responses.forEach( response => (callSendAPI(sender_psid, response)))
        }).catch(errorResp => {
          callSendAPI(sender_psid, errorResp);
        })     
    },

    callSendAPI,

    handleOptin(sender_psid, received_optin) {
      const {one_time_notif_token, payload} = received_optin;
      storeNotifToken(one_time_notif_token, +payload)
      .then(result => {
        callSendAPI(sender_psid, {text: "Success, you will be notified when the product is back in stock"});
      })
      .catch(err => {
        callSendAPI(sender_psid, {text: "Error creating notification, please try again"});
      })
    },
    callSendAPINotif
    
}

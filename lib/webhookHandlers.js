const request = require('request');
const { handleDefault, processPostback, handleModifyCart, handleBrowseCategories } = require('./handlers');
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
        console.log(request_body);
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
        let response;

        // Check if the message contains text
        if (received_message.text) {    
            const number = firstEntity(received_message.nlp, 'wit$number:number');
            const name = firstEntity(received_message.nlp, 'wit$contact:contact');
            if (number && number.confidence > 0.8) {
              const value = number.value;
              if(value < 1000 && users[sender_psid].previousPostback === 'cart') {
                    const productId = users.productId
                    if(productId) 
                    {
                        addToCart(sender_psid, productId, value).then((resp) =>{
                          const response = {
                              "text" : "Product Added to cart succesfully"
                            }
                          callSendAPI(sender_psid, response)
                        }).catch(err => {
                            console.error(err);
                            callSendAPI(sender_psid, {text: 'Unable to add product to cart, please try again'});
                        })
                    }
                    return;
              }
              else if (value > 1000 && users[sender_psid].previousCommand === 'checkout') {
                users[sender_psid].phone = value;
                callSendAPI(sender_psid, {text: 'Click the \'Proceed to checkout\' button on the persistent menu to proceed to checkout page'});
              }

            }
            if (name && name.confidence > 0.75 && users[sender_psid].previousCommand === 'checkout') {
              let value = name.value;
              users[sender_psid].fullname = value;
              users[sender_psid].previousCommand = 'checkout';
              callSendAPI(sender_psid, {text: 'Kindly, type in your phone number next with no dashes or spaces between the numbers'});
              return;
              //
            }
            // Create the payload for a basic text message
            const errorResp = {
              "text" : "An error occured on our end, please bear with us"
            }
            let { text } = received_message;
            const splitText = text.trim().toLowerCase().split(' ').filter((el) => {
              return Boolean(el.trim())
            });
            const command = splitText[0];
            users[sender_psid].previousCommand = command;
            switch (command) {
              case "browse":
                handleBrowseCategories(splitText.slice(1))
                .then(responses => ( responses.forEach( response => (callSendAPI(sender_psid, response)))))
                .catch(response => (callSendAPI(sender_psid, response)))
                break;
              case 'checkout':
                callSendAPI(sender_psid, {text:'Kindly, type in your full name'});
                break;
              case "quantity":
                handleModifyCart(splitText.slice(1))
                .then(response => (callSendAPI(sender_psid, response)))
                .catch(response => (callSendAPI(sender_psid, response)));
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
        
        // Get the payload for the postback
        let payload = received_postback.payload.trim().toLowerCase();

        // Set the response based on the postback payload
        processPostback(sender_psid, payload).then(responses => {
          responses.forEach( response => (callSendAPI(sender_psid, response)))
        }).catch(errorResp => {
          callSendAPI(sender_psid, errorResp);
        })     
    },

   
    
}

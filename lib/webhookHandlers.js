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

        } else {
        console.error("Unable to send message:" + err);
        }
    }); 
}
function firstTrait(nlp, name) {
  return nlp && nlp.traits && nlp.traits[name] && nlp.traits[name][0];
}
module.exports = {
    // Handles messages events
    handleMessage(sender_psid, received_message) {
        
        // Check if the message contains text
        if (received_message.text) {   
            let { text } = received_message;
            const splitText = text.trim().toLowerCase().split(' ').filter((el) => {
              return Boolean(el.trim())
            });
            const command = splitText[0]; 
            const number = firstTrait(received_message.nlp, 'wit$number');
            const name = firstTrait(received_message.nlp, 'wit$contact');
            console.log(received_message.nlp);
            console.log(number);
            const previousPostback = users[sender_psid].previousPostback;
            const previousCommand = users[sender_psid].previousCommand;
            if ((!number || (number && number.confidence < 0.8)) && previousPostback === 'cart' && command !=='cancel')
            {
              callSendAPI(sender_psid, {text: 'Kindly type in a valid quantity,\n or type \'cancel\' to end this operation'});
              return;
            }
            if ((!name || (name && name.confidence < 0.7)) && previousCommand === 'checkout' && command !== 'cancel') {
              callSendAPI(sender_psid, {text: 'Kindly type in a valid name,\n or type "cancel" to end this operation'});
              return;
            }
            if ((!number || (number && number.confidence < 0.8)) && previousCommand === 'phone' && command !== 'cancel')
            {
              callSendAPI(sender_psid, {text: 'Kindly type in a valid phone number with no dashes or spaces,\n or type "cancel" to end this operation'});
              return;
            }
            if (number && number.confidence > 0.8 && command !== 'cancel') {
              const value = number.value;
              if(previousPostback === 'cart') {
                    const productId = users[sender_psid].productId
                    if(productId && value <= users[sender_psid].stock) 
                    {
                        addToCart(sender_psid, productId, value).then((resp) =>{
                          const response = {
                              "text" : "Product Added to cart succesfully"
                            }
                          callSendAPI(sender_psid, response)
                          users[sender_psid].previousPostback = '';
                        }).catch(err => {
                            console.error(err);
                            callSendAPI(sender_psid, {text: 'Unable to add product to cart, please try again'});
                        })
                    }
                    else{
                        callSendAPI(sender_psid, {text: 'Kindly type in a valid quantity'});
                    }
                  return;
              }
              if ((value && (String(value).lenghth === 11 || String(value).length === 13)) && previousCommand === 'phone') {
                users[sender_psid].phone = value;
                callSendAPI(sender_psid, {text: 'Click the \'Proceed to checkout\' button on the persistent menu to proceed to checkout page'});
                users[sender_psid].previousCommand = '';
                return;
              }
            }
            if ((name && name.confidence > 0.75) && previousCommand === 'checkout' && command !== 'cancel') {
              let value = name.value;
              users[sender_psid].fullname = value;
              users[sender_psid].previousCommand = 'phone';
              callSendAPI(sender_psid, {text: 'Kindly, type in your phone number next with no dashes or spaces between the numbers,\n or type "cancel" to end this operation'});
              return;
              //
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
              case 'checkout':
                callSendAPI(sender_psid, {text:'Kindly, type in your full name'});
                break;
              case "quantity":
                handleModifyCart(splitText.slice(1))
                .then(response => (callSendAPI(sender_psid, response)))
                .catch(response => (callSendAPI(sender_psid, response)));
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

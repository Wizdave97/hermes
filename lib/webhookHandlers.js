const request = require('request');
const { handleDefault, processPostback, handleModifyCart, handleFetchCart, handleBrowseCategories } = require('./handlers');
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

module.exports = {
    // Handles messages events
    handleMessage(sender_psid, received_message) {
        let response;

        // Check if the message contains text
        if (received_message.text) {    

            // Create the payload for a basic text message
            const errorResp = {
              "text" : "An error occured on our end, please bear with us"
            }
            let { text } = received_message;
            const splitText = text.trim().toLowerCase().split(' ').filter((el) => {
              return Boolean(el.trim())
            });
            const command = splitText[0];
            switch (command) {
              case "cart":
                handleFetchCart(sender_psid)
                .then(responses => {
                  responses.forEach( response => (callSendAPI(sender_psid, response)))
                }).catch(response => {
                  callSendAPI(sender_psid, response)
                })
                break;
              case "orders":
                break;
              case "checkout":
                break;
              case "browse":
                handleBrowseCategories(splitText.slice(1))
                .then(responses => ( responses.forEach( response => (callSendAPI(sender_psid, response)))))
                .catch(response => (callSendAPI(sender_psid, response)))
                break;
              case "modify":
                handleModifyCart(splitText.slice(1))
                .then(response => (callSendAPI(sender_psid, response)))
                .catch(response => (callSendAPI(sender_psid, response)));
                break;
              case "delete":
                break;
              case "details":
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
        let payload = received_postback.payload.trim();

        // Set the response based on the postback payload
        processPostback(sender_psid, payload).then(response => {
          callSendAPI(sender_psid, response)
        }).catch(errorResp => {
          callSendAPI(sender_psid, errorResp);
        })     
    },

   
    
}

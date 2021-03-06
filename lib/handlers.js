const { WELCOME_MSG, formulateMessage } = require('./messages');
const models = require('../models');
const { getProducts, fetchCart, deleteCartItem } = require('./helpers');
const cache = require('../lib/cache');
const handlers = {
    handleDefault (command, sender_psid) {
        command = command.toLowerCase();
        return new Promise((resolve, reject) => {
            models.Categories.findAll().then(rows => {
                const responses = [];
                const lowerCaseRows = rows.map((row) => {
                    return row.category.toLowerCase();
                })
                let isQuickReply = lowerCaseRows.indexOf(command) > -1;
                const quick_replies = lowerCaseRows.map(category =>(
                    {
                        "content_type":"text",
                        "title": category,
                        "payload": category,
                    }
                ))
                let response = {
                    "text": WELCOME_MSG,
                    quick_replies
                }
                responses.push(response)
                if (isQuickReply) {
                    cache.users[sender_psid].category = command;
                    cache.users[sender_psid].nextPage = 2;
                    responses.pop();
                    getProducts(command, 1).then((result) => {
                        response = {
                              "attachment": {
                                "type": "template",
                                "payload": {
                                  "template_type": "generic",
                                  "elements": [
                                      ...result.rows.map((row) => ({
                                        "title": row.product_name,
                                        "subtitle": `Price: ${row.price} ${row.stock <= 0 ? 'Out of stock':'Availabe: '+row.stock}`,
                                        "image_url": row.img_url,
                                        "buttons": [
                                            {
                                                "type": "postback",
                                                "title": `${row.stock <= 0 ?'Preorder' : 'Add to cart'}`,
                                                "payload": `${row.stock <= 0 ? `notify-${row.id}-${row.product_name}`:`cart-${row.id}-${row.stock}`}`,
                                            },
                                        ],
                                      }))
                                    ]
                                }
                              }
                            }
                           
                            if(result.pages > (cache.users[sender_psid].nextPage))
                            {
                                    const next = {
                                        "text": "Click the button below to see the next list in this category",
                                        quick_replies: [{
                                            "content_type":"text",
                                            "title": "Next List",
                                            "payload": "next"
                                        }]
                                    }
                                    cache.users[sender_psid].nextPage++;
                                    responses.push(next);
                            }
                            else {
                                const info = {
                                    "text": "There are no more products in this category\nKindly checkout other categories of products",
                                    quick_replies
                                }
                                responses.push(info)
                                cache.users[sender_psid].nextPage = 1;
                                cache.users[sender_psid].category = '';
                            }
                            if(result.rows.length > 0) responses.unshift(response);
                            resolve(responses);
                    }).catch(err => {
                        reject(err)
                    })
                }
                else resolve(responses);
            }).catch(err => {
                reject(err);
            })  
        })
    },
    processPostback (sender_psid, payloadStr) {
        return new Promise((resolve, reject)=>{
            const splitPayload = payloadStr.split('-').filter(el =>(Boolean(el.trim())));
            cache.users[sender_psid].previousPostback = splitPayload[0];
            let productId;
            switch (splitPayload[0]) {
                case "cart":
                    productId = +splitPayload[1];
                    cache.users[sender_psid].productId = productId;
                    cache.users[sender_psid].stock = +splitPayload[2];
                    resolve([{text: 'Please type in the quantity of the product you need'}]);
                    break;
                case "notify":
                    productId = +splitPayload[1];
                    const productName = splitPayload[2];
                    const notify_response = {
                        "attachment": {
                            "type":"template",
                            "payload": {
                              "template_type":"one_time_notif_req",
                              "title":`Get notified When: ${productName} is back in stock`,
                              "payload":`${productId}`
                            }
                          }
                    }
                    resolve([notify_response])
                case "change":
                    productId = +splitPayload[1];
                    cache.users[sender_psid].productId = productId;
                    cache.users[sender_psid].stock = +splitPayload[2];
                    resolve([{text: 'Please type in the new quantity of the product'}]);
                    break;
                case 'checkout':
                    if(cache.users[sender_psid].fullname 
                        && cache.users[sender_psid].phone
                        && cache.users[sender_psid].email)
                    {
                        const checkout_response = {
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
                        resolve([checkout_response]);
                        cache.users[sender_psid].previousPostback = '';
                    }
                    else resolve([{text:'Kindly, type in your full name'}]);
                    break;
                case "delete":
                    const itemId = +splitPayload[1];
                    deleteCartItem(itemId).then((resp) =>{
                        const response = {
                            "text" : "Product removed from cart succesfully"
                          }
                        resolve([response])
                    }).catch(err => {
                        console.error(err);
                        reject({text: 'Unable to delete product from cart'});
                    })
                    break;
                case "my_cart":
                    handlers.handleFetchCart(sender_psid)
                    .then(responses => {
                        resolve(responses)
                    }).catch(response => {
                        reject(response);
                    })
                    break;
                case "categories":
                    const responses = [{
                        "text": "Kindly select any of the following categories to see products",
                        quick_replies: cache.quick_replies
                    }]
                    resolve(responses)
                    break;
                case "get_started":
                    handlers.handleDefault('get_started')
                    .then((responses) =>{
                     resolve(responses)
                    })
                    .catch(err=> {
                      console.error(err)
                      reject({"text" : "An error occured on our end, please bear with us"})
                    });
                    break;
                default:
                    break;
            }
        })
    }, 
    handleFetchCart(sender_psid) {
        return new Promise((resolve, reject) => {
            fetchCart(sender_psid).then(rows => {
                const responses = [];
               if(rows.length > 0)
               {
                    const response = {
                        "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": [
                                ...rows.map((row) => ({
                                "title": row.Product.product_name,
                                "subtitle": `id: ${row.id}\tQuantity: ${row.quantity}\nAvailable: ${row.Product.stock}\tPrice: ${row.Product.price}`,
                                "image_url": row.Product.img_url,
                                "buttons": [
                                    {
                                        "type": "postback",
                                        "title": "Change Quantity",
                                        "payload": `change-${row.id}-${row.Product.stock}`,
                                    },
                                    {
                                        "type": "postback",
                                        "title": "Delete from cart",
                                        "payload": `delete-${row.id}`,
                                    },
                                ],
                                }))
                            ]
                        }
                        }
                    }
                    responses.push(response);
                }
               
                let total = 0
                rows.forEach(row => {
                    total += (row.quantity * row.Product.price)
                })
                cart = { text: `Your Cart Summary:\n${rows.length} item${rows.length <= 1? '': 's'} totaling ${total}`};
                responses.unshift(cart);
                resolve(responses);
            }).catch(err => {
                console.error(err);
                reject({text: 'Error occured while fetching cart'});
            })
        })
    }, 
    handleBrowseCategories(sender_psid) {
        return new Promise((resolve, reject) => {
            const category = cache.users[sender_psid].category
            const page = cache.users[sender_psid].nextPage
            const responses = [];
            if (page && category) {
                getProducts(category, page).then((result) => {
                    let response = {
                          "attachment": { 
                            "type": "template",
                            "payload": {
                              "template_type": "generic",
                              "elements": [
                                  ...result.rows.map((row) => ({
                                    "title": row.product_name,
                                    "subtitle": `Price: ${row.price} ${row.stock <= 0 ? 'Out of stock':'Availabe: '+row.stock}`,
                                    "image_url": row.img_url,
                                    "buttons": [
                                        {
                                            "type": "postback",
                                            "title": `${row.stock <= 0 ?'Preorder' : 'Add to cart'}`,
                                            "payload": `${row.stock <= 0 ? `notify-${row.id}-${row.product_name}`:`cart-${row.id}-${row.stock}`}`,
                                        },
                                    ],
                                  }))
                                ]
                            }
                          }
                        }
                        if(result.pages > (cache.users[sender_psid].nextPage))
                        {
                                const next = {
                                    "text": "Click the button below to see the next list in this category",
                                    quick_replies: [{
                                        "content_type":"text",
                                        "title": "Next List",
                                        "payload": "next"
                                    }]
                                }
                                cache.users[sender_psid].nextPage++;
                                responses.push(next);
                        }
                        else {
                            const info = {
                                "text": "There are no more products in this category\nKindly checkout other categories of products",
                                quick_replies
                            }
                            responses.push(info)
                            cache.users[sender_psid].nextPage = 1;
                            cache.users[sender_psid].category = '';
                        }
                        if(result.rows.length > 0) responses.unshift(response);
                        resolve(responses);
                }).catch(err => {
                    console.error(err)
                    reject({text: 'An error occured while fetching products\nKindly try again'})
                })
            }
            else {
                reject({text: 'Please send a valid message in the form\n"browse iphones page 2"'});
            }
        })
    }
}
module.exports = handlers
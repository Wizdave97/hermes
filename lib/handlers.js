const { WELCOME_MSG, formulateMessage, MODIFY_CART } = require('./messages');
const models = require('../models');
const { getProducts, addToCart, modifyCart, fetchCart, deleteCartItem } = require('./helpers');
const cache = require('../lib/cache');
module.exports = {
    handleDefault (command) {
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
                                        "subtitle": `Price: ${row.price} Available: ${row.stock}`,
                                        "image_url": row.img_url,
                                        "buttons": [
                                            {
                                                "type": "postback",
                                                "title": "Add to cart",
                                                "payload": `cart-${row.id}`,
                                            },
                                        ],
                                      }))
                                    ]
                                }
                              }
                            }
                            if(result.pages > 0)
                            {
                                const info = {
                                    "text": formulateMessage(command, result.pages),
                                }
                                responses.push(info);
                            }
                            if(result.rows.length <=0) {
                                response = {
                                    "text": WELCOME_MSG,
                                    quick_replies
                                }
                            }
                            responses.push(response);
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
            switch (splitPayload[0]) {
                case "cart":
                    const productId = +splitPayload[1];
                    addToCart(sender_psid, productId).then((resp) =>{
                        const response = {
                            "text" : "Product Added to cart succesfully"
                          }
                        resolve(response)
                    }).catch(err => {
                        console.error(err);
                        reject({text: 'Unable to add product to cart'});
                    })
                    break;
                case "delete":
                    const itemId = +splitPayload[1];
                    deleteCartItem(itemId).then((resp) =>{
                        const response = {
                            "text" : "Product removed from cart succesfully"
                          }
                        resolve(response)
                    }).catch(err => {
                        console.error(err);
                        reject({text: 'Unable to delete product from cart'});
                    })
                    break;
                default:
                    break;
            }
        })
    },
    handleModifyCart(strArr) {
        return new Promise((resolve, reject) => {
            const id = +strArr[0];
            const quantity = +strArr[1]
            if(id && quantity) {
                modifyCart(id, quantity).then(result => {
                    const response = {
                        "text" : "Item quantity modified successfully"
                    }
                    resolve(response)
                }).catch(err => {
                    console.error(err);
                    const errorResponse = {
                        "text" : "An error occured, please bear with us"
                    }
                    reject(errorResponse);
                });
                return;
            }
            const errorResponse = {
                "text" : "Invalid command, please type in the format\n'modify <ITEM_ID> <QUANTITY>'"
            }
            reject(errorResponse)
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
                                "subtitle": `id: ${row.id}\nQuantity: ${row.quantity}\nPrice: ${row.Product.price}`,
                                "image_url": row.Product.img_url,
                                "buttons": [
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
                responses.unshift({text: MODIFY_CART });
                resolve(responses);
            }).catch(err => {
                console.error(err);
                reject({text: 'Error occured while fetching cart'});
            })
        })
    }, 
    handleBrowseCategories(splitTextArr) {
        return new Promise((resolve, reject) => {
            const category = splitTextArr[0];
            const page = +splitTextArr[2];
            const responses = [];
            if (page && category) {
                getProducts(category, page).then((result) => {
                    response = {
                          "attachment": {
                            "type": "template",
                            "payload": {
                              "template_type": "generic",
                              "elements": [
                                  ...result.rows.map((row) => ({
                                    "title": row.product_name,
                                    "subtitle": `Price: ${row.price} Available: ${row.stock}`,
                                    "image_url": row.img_url,
                                    "buttons": [
                                        {
                                            "type": "postback",
                                            "title": "Add to cart",
                                            "payload": `cart-${row.id}`,
                                        },
                                    ],
                                  }))
                                ]
                            }
                          }
                        }
                        if(result.pages > 0)
                        {
                            const info = {
                                "text": formulateMessage(command, result.pages),
                            }
                            responses.push(info);
                        }
                        if(result.rows.length <=0) {
                                response = {
                                    "text": "You've reached the end of this category\nKindly checkout other categories of products",
                                    quick_replies: cache.quick_replies.length > 0 ? cache.quick_replies : []
                                }
                        
                        }
                        responses.push(response);
                        resolve(responses);
                }).catch(err => {
                    reject(err)
                })
            }
            else {
                reject({text: 'Please send a valid message in the form\n"browse iphones page 2"'});
            }
        })
    }
}
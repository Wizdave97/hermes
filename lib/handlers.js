const { WELCOME_MSG, formulateMessage } = require('./messages');
const models = require('../models');
const { getProducts } = require('./helpers');
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
                                                "payload": `${row.id}`,
                                            },
                                        ],
                                      }))
                                    ]
                                }
                              }
                            }
                            const info = {
                                "text": formulateMessage(command, result.pages),
                            }
                            responses.push(info);
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
    handlePostback () {

    }
}
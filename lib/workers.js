const models = require('../models');
const { callSendAPINotif } = require('./webhookHandlers');
const Sequelize = require('sequelize');
const workers = {
    init() {
        let page = 20;
        setInterval(async () => {
            try{
                await workers.triageNotifs(page);
            }
            catch(err){
                console.error(err);
            }
            finally {
                //page++;
            }
            
        }, 10 * 60 * 1000)
        console.log('\x1b[33m%s\x1b[0m: ',"Background workers running")
    },
    triageNotifs(page) {
        return new Promise((resolve, reject) => {
            models.Notifications.findAll({
                include:[{
                    model: models.Products,
                    required: true,
                    where: {
                        stock: {
                            [Sequelize.Op.gt]: 0
                        }
                    }
                }],
                where: {
                    expires_in: {
                        [Sequelize.Op.gt] : new Date()
                    }
                },
                limit: 10,
                offset: (page - 1) * 10
            }).then(rows => {
                rows.map(row => {
                    const response = {
                        "attachment": {
                            "type": "template",
                            "payload": {
                              "template_type": "generic",
                              "elements": [
                                  {
                                    "title": row.Product.product_name,
                                    "subtitle": `Price: ${row.Product.price} Availabe: ${row.Product.stock}`,
                                    "image_url": row.Product.img_url,
                                    "buttons": [
                                        {
                                            "type": "postback",
                                            "title": "Add to cart",
                                            "payload": `cart-${row.id}-${row.stock}`,
                                        },
                                    ],
                                  }
                                ]
                            }
                          }
                    }
                    callSendAPINotif(row.token,response)
                })
                resolve()
            }).catch(err => {
                console.error(err);
                reject(err);
            })
        })
    },

}

module.exports = workers
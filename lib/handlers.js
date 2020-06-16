const { WELCOME_MSG } = require('./messages');
const models = require('../models');

module.exports = {
    handleDefault () {
        return new Promise((resolve, reject) => {
            models.Categories.findAll().then(rows => {
                const quick_replies = rows.map(row =>(
                    {
                        "content_type":"text",
                        "title": row.category,
                        "payload": row.category,
                    }
                ))
                let response = {
                    "text": WELCOME_MSG,
                    quick_replies
                }
                resolve(response);
            }).catch(err => {
                console.error(err);
                reject(err);
            })  
        })
    },
}
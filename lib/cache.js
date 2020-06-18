const models = require('../models');
let quick_replies = [];

models.Categories.findAll().then(rows => {
    const lowerCaseRows = rows.map((row) => {
        return row.category.toLowerCase();
    })
    lowerCaseRows.forEach(category =>(
        quick_replies.push({
            "content_type":"text",
            "title": category,
            "payload": category,
        })
    ))
}).catch(err => {
    [].forEach(el =>(quick_replies.push(el)));
})
module.exports = {
    quick_replies,
    users : {}
}
const { messages } = require('./messages');

module.exports = {
    handleDefault () {
        let response = {
            "text": messages.WELCOME_MSG
        }
        return response;
    },
}
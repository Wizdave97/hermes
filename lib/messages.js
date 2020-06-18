
const WELCOME_MSG = `Welcome to our online store,\n 
please click any of the following buttons to browse through products in that category\n
Use the persistent menu to access your cart, product categories and checkout form at anytime`;

const formulateMessage = (category, pages) => {
    const msg = `We have ${pages} pages left in the ${category} category.\n
To browse through them send a message in the format\n
"browse <CATEGORY> page <NUMBER>"\n e.g. \n
"browse ${category} page 2"\n
The command is case insensitive`;

    return msg;
}

const MODIFY_CART = `To change the quantity of an item in your cart at any time, type a message in the form\n
"quantity {Id} {Quantity}"\n
e.g "quantity 23 4"\n
Id is the item Id as shown in the cart\nQuantity is the new quantity you want`;

module.exports = {
    WELCOME_MSG, formulateMessage, MODIFY_CART
}

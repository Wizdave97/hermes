
const WELCOME_MSG = `Welcome to our online store,\n 
please click any of the following buttons to browse through products in that category\n
Send message 'checkout' to start collection of your details before you proceed to checkout\n
Use the persistent menu to access your cart, product categories and complete the checkout form at anytime`;

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

const DELETE_ITEM = `To delete an Item from your cart type a message in the form\n
"delete <ITEM_ID>"\n e.g.
"delete 23"\n
The command is case insensitive`;
const CHECKOUT_DETAILS = `To complete the checkout process type a message in the form\n
"details <FIRSTNAME> <LASTNAME> <PHONE_NUMBER> <DELIVERY_ADDRESS>"\n e.g
"details John Doe 2348062437675 17b 12th Avenue Lagos Nigeria`
module.exports = {
    WELCOME_MSG, formulateMessage, MODIFY_CART, DELETE_ITEM
}

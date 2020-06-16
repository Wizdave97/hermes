
const WELCOME_MSG = `Welcome to our online store,\n 
please click any of the following buttons to browse through products in that category\n
To access your cart at any time type a message "cart"\n
To acess your orders, type a message "orders"\n
To start the checkout process, type a message "checkout"`;

const formulateMessage = (category, pages) => {
    const msg = `We have ${pages} pages in the ${category} category.
    To browse through them send a message in the format\n
    "browse <CATEGORY> page <NUMBER>"\n e.g. \n
    "browse ${categoy} page 2"\n
    The command is case insensitive`;

    return msg;
}

const MODIFY_CART = `To change the quantity of an item in your cart, type a message in the form\n
    "modify <ITEM_ID> <QUANTITY>"\n e.g.\n
    "modify 23 4"\n
    Where the second number from the left is the item ID as listed in your cart and the last number is the new quantity\n
    The command is case insensitive`;

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
var checkoutForm = document.getElementById('checkoutForm');

checkoutForm.addEventListener('submit', payWithPaystack, false);

function payWithPaystack(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const amount = document.getElementById('totalPrice').textContent;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const sender_psid = document.getElementById('sender_psid').textContent;
  const name = document.getElementById('fullname').value.split(' ').filter(str => (Boolean(str)));
  const config = {

    key: 'pk_test_e413e8381c8b5bf384fd2afee1dc43b8b965c087', // Replace with your public key

    email: email,

    amount: +amount, // the amount value is multiplied by 100 to convert to the lowest currency unit

    currency: 'NGN', // Use GHS for Ghana Cedis or USD for US Dollars

    firstname: name[0],

    lastname: name[name.length - 1],

    reference: `${Date.now()}-${email}`, // Replace with a reference you generated

    callback: function(response) {

      //this happens after the payment is completed successfully
      
      const reference = response.reference;
      const body = {
          sender_psid: +sender_psid,
          order_number: Date.now(),
          fullname: name.join(' '),
          phone: phone,
          address: address,
          paid: true,
          transaction_ref: reference
      }
      alert('Payment Successful! Reference: ' + reference + '\nClose this alert and wait while your order is completed');
      fetch('https://sheltered-headland-16417.herokuapp.com/checkout',{
          method:'POST',
          body: JSON.stringify(body)
        }
      ).then(resp => resp.json()).then(resp => {
          alert(resp.msg);
      }).catch(err => {
          alert("Could not process transaction, please contact our customer service with your reference number for a refund");
      })
      // Make an AJAX call to your server with the reference to verify the transaction

    },

    onClose: function() {

      alert('Transaction was not completed please try again, window closed.');

    },
  }  
  if (email && amount && phone && sender_psid && name && address)
  {
    const paystackPopup = new Popup(config);
    paystackPopup.open();
  }
  else{
      alert('Please fill the form correctly')
  }
  

}
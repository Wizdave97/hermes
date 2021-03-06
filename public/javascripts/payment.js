
const pay = document.getElementById('checkoutForm');


pay.addEventListener('submit', makePayment);

function makePayment(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const amount = document.getElementById('totalPrice').textContent.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const sender_psid = document.getElementById('sender_psid').textContent.trim();
    const name = document.getElementById('fullname').value;
    if (!email || !amount || !phone || !sender_psid || !name || !address) {
        alert('Please fill the form correctly');
        return;
    }
    FlutterwaveCheckout({
      public_key: "FLWPUBK_TEST-9d828a65da00ae9be009cc7436ddcd5e-X",
      tx_ref: `${Date.now()}-${email}`,
      amount: +amount,
      currency: "NGN",
      payment_options: "card",
      customer: {
        email: email,
        phone_number: phone,
        name: name,
      },
      callback: function (data) {
        if (data.status === 'successful') {
            
            const body = {
                sender_psid: +sender_psid,
                order_number: Date.now(),
                fullname: name,
                phone: phone,
                address: address,
                paid: true,
                email: email,
                transaction_ref: data.tx_ref
                }
                alert('Payment Successful! Reference: ' + data.tx_ref + '\nClose this alert and wait while your order is completed\nPlease do not close the modal');
                fetch('https://sheltered-headland-16417.herokuapp.com/checkout',{
                    method:'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                    }
                ).then(resp => resp.json()).then(resp => {
                    
                    alert(resp.msg);
                }).catch(err => {
                    alert("Could not process transaction, please contact our customer service with your reference number for a refund");
                })
                // Make an AJAX call to your server with the reference to verify the transaction
        }
        else {
            alert("Payment was not successful");
        }
      },
      customizations: {
        title: "Apple Products Store",
        description: "Payment for items in cart",
        logo: "https://assets.piedpiper.com/logo.png",
      },
    });
  }
  
  
  
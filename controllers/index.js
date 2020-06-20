const lib = require('../lib/webhookHandlers');
const { validationResult } = require('express-validator');
const models = require('../models');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { users, categories } = require('../lib/cache');
const { fetchCart } = require('../lib/helpers');
const { callSendAPI} = require('../lib/webhookHandlers');
const SECRET = process.env.SECRET;
const USER_NAME = 'wizdave97@gmail.com';
const PASSWORD = 'valerianspace';


const renderAddProduct = (res,locals) => {
  return models.Categories.findAll().then(rows => {
    res.render('add_product', {
      product: {
        categories: rows
      },
      title: 'Add Product',
      ...locals
    })
  }).catch(err => {
    console.error(err);
    res.render('add_product',{
      error: 'Unknown error occured'
    });
  })
}
const controllers = {
  addProduct(req, res, next) {
    try 
    {
      const errors = validationResult(req);
      if(req.file && errors.isEmpty()){
        const img_url = req.file.cloudStoragePublicUrl
        models.Products.create({
          product_name: req.body.product_name,
          price: req.body.price,
          stock: req.body.stock,
          category_id: +req.body.category,
          img_url
        }).then(result  => {
          renderAddProduct(res, {success: 'Product uploaded successfully'})
        }).catch(err => {
          renderAddProduct(res, {error: 'There was an error, please try again'})
        })
      }
      else if(req.file && !errors.isEmpty()) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Unable to delete file');
          return null;
        });
        renderAddProduct(res, {error: 'Ensure all text fields are properly filled'});
        return;
      }
      else {
        if(req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Unable to delete file');
            return null;
          });
        }
        renderAddProduct(res, {error: 'Ensure all form fields are properly filled and an image is uploaded'});
        return;
      }
    }
    catch(err)
    {
      if(req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Unable to delete file');
          return null;
        });
      }
      renderAddProduct(res, {error: 'Unable to add product at this time'});
    }
  },
  postCategories(req, res, next) {
    try
    {
        const errors = validationResult(req);
        if(errors.isEmpty())
        {
          const categories = req.body.categories.split(',').filter(str =>(
            Boolean(str.trim()) && str.trim().length >=1
          )).map(str => (
            {category: str.trim().toLowerCase()}
          ));
          if(categories.length >= 1) {
            models.Categories.bulkCreate(categories).then(result => {
              res.render('add_categories', {success: "Categories created successfully"});
            }).catch(err => {
              console.error(err)
              res.render('add_categories', {error: 'Please try again an unknown error occured'});
            }) 
          }
          else {
            console.error(errors);
            res.render('add_categories', {error: 'Please fill the form with a comma seperated string'});
          }
          return;
        }
        res.render('add_categories', {error: 'Please fill the form with a comma seperated string'});

    }
    catch(err) 
    {
      console.error(err);
      res.render('add_categories', {error: 'Unknown error occured'});
    }
  },
  login(req, res, next) {
      const { email, password} = req.body;
      if (email.trim() === USER_NAME && password.trim() === PASSWORD)
      {
        const cookieExpiration = 1000 * 24 * 60 * 60;
        const token = jwt.sign({email, password}, SECRET, { expiresIn: Date.now() + cookieExpiration});
        res.cookie('token', token, {
          expires: new Date(Date.now() + cookieExpiration),
          secure: process.env.NODE_ENV !== 'development',
          httpOnly: true,
        });
        res.redirect('/product');
      }
      else
      {
        res.render('login', {
          error: 'Invalid Login details', title: 'Bot Admin Login'})
      }
  },
  getAddProduct(req, res, next) {
    models.Categories.findAll().then(rows => {
      res.render('add_product', {
        product: {
          categories: rows
        },
        title: 'Add Product'
      })
    }).catch(err => {
      console.error(err);
      res.render('add_product',{
        error: 'Unknown error occured'
      });
    })
  },
  getCheckout(req, res, next) {
    const sender_psid = +req.query.sender_psid ? +req.query.sender_psid.trim(): false;
    const title = 'Checkout';
    if(sender_psid) {
      let fullname, phone, email;
      if(users[sender_psid]){
        user = users[sender_psid];
        fullname = user.fullname;
        phone = user.phone;
        email = user.email;
      }
      fetchCart(sender_psid)
      .then(rows => {
        const cart = rows.map(row =>({
          product_name: row.Product.product_name,
          img_url: row.Product.img_url,
          price: row.Product.price,
          quantity: row.quantity
        }))
        
        let totalPrice = 0;
        cart.forEach(row => {
            totalPrice += (+row.quantity * +row.price)
        })
        res.render('checkout', {
          cart: cart.length > 0 ? cart : null, totalPrice, fullname, phone, email, title, sender_psid
        })
      })
      .catch(err => {
        console.error(err);
        res.render('checkout', {error: 'An error occured while fetching your cart, cannot compute checkout form', title})
      })
    }
    else {
      res.render('checkout', {error: 'Cannot find your id, are you sure you were directed from messenger?', title})
    } 
  },
  postCheckout(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      res.status(400).send({status: 400, msg:'Check your transaction details and ensure all are correct'});
      return;
    }
    
    let completedOrder;
    models.sequelize.transaction((t) => {
      const orderDetails = {
        fullname: req.body.fullname,
        phone: req.body.phone,
        address: req.body.address,
        transaction_ref: req.body.transaction_ref,
        paid: req.body.paid,
        order_number: req.body.order_number,
        sender_psid: req.body.sender_psid
      }
      return models.Orders.create(orderDetails,{transaction: t})
      .then(order => {
        completedOrder = order;
        return models.Cart.findAll({where:{
          sender_psid: req.body.sender_psid
        },transaction: t}).then(rows => {
          const itemRows = rows.map(row => {
            return {order_id:completedOrder.id, product_id: row.product_id, quantity: row.quantity}
          })
          return models.Items.bulkCreate(itemRows, {transaction: t}).then(result => {
            return models.Cart.destroy({where: {sender_psid: req.body.sender_psid}, transaction: t})
          })
        })
      })
    }).then(resp => {
      models.Users.findAll({where:{
        user_psid: req.body.sender_psid
      }}).then(rows => {
        if (rows.length >= 1) {
          models.Users.update({
            fullname: req.body.fullname, 
            phone: req.body.phone, 
            email: req.body.email,
          }, { where: { user_psid: req.body.sender_psid}}).then((result)=>{
            console.log(result)
          }).catch(err => {
            console.error(err)
          })
        }
        else {
          models.Users.create({
            fullname: req.body.fullname, 
            phone: req.body.phone, 
            email: req.body.email,
            user_psid: req.body.sender_psid
          }).then(result => {
            console.log(result)
          }).catch(err => {
            console.error(err)
          })
        }
      }).catch(err => {
        console.error(err)
      })
      res.status(200).send({status:200, msg:"Order completed successfully"});
      callSendAPI(req.body.sender_psid, 
        {text: `Your order has been completed, you will be contacted on your mobile number for delivery.\n
        Your Order Details are\n
        Order number: ${completedOrder.order_number}\n
        Transaction_Ref: ${req.body.transaction_ref}\n
        fullname: ${req.body.fullname}\n
        Phone: ${req.body.phone}\n
        Address: ${req.body.address}`});
    }).catch(err => {
      console.error(err);
      res.status(500).send({status:500, msg:'An error occured while creating the transaction, please contact us to get a refund'});
      callSendAPI(req.body.sender_psid, {text: 'An error occured while creating the transaction, please contact us to get a refund'});
    })
  },
  getEditProduct(req, res) {
    try {
      const errors = validationResult(req);
      const id = +req.query.id;
      if (errors.isEmpty()) {
          models.sequelize.transaction(t => {
            return models.Categories.findAll({transaction: t})
            .then(categories => {
              return models.Products.findAll({
                where: {
                  id
                },
                transaction: t
              }).then(rows => {
                res.render('edit_products', {
                  categories, product:rows[0]
                })
              })
            })
          }).then(result => {
  
          }).catch(err => {
            console.error(err)
            res.status(400).render('edit_products', {
              error: 'An error occured while fetching product details'
            })
          })
          return;
      }
      res.status(400).render('edit_products', {
        error: 'Product id was missing in request'
      })
    }
    catch (err) {
      console.error(err);
      res.status(500).render('error', {message : 'An internal server error occured'});
    }
  },
  putProduct(req, res) {
    try {
      const errors = validationResult(req);
      if(errors.isEmpty()) {
        const id = +req.query.id;
        const errors = validationResult(req);
        models.Products.update({
          product_name: req.body.product_name,
          stock: req.body.stock,
          price: req.body.price,
          category_id: +req.body.category
        }, {
          where: { id }
        }).then(result => {
          res.redirect('/allProducts');
        }).catch(err => {
          console.error(err);
          res.render('edit_products', {
            error: 'Unable to update product details, please try again', categories
          });
        })
        return;
      }
      res.status(400).render('edit_products', {
        error: 'Ensure all form fields are correctly filled and the product id exists in the query'
      })
    }
    catch (err) {
      console.error(err);
      res.status(500).render('error', {message : 'An internal server error occured'});
    }
  },
  getOrders (req, res) {
    try {
      models.sequelize.transaction(t => {
        return models.Orders.findAll({
          include:[{
            model: models.Items,
            required: true
          }],
          transaction: t
        }).then( orders => {
          return models.Items.findAll({
            include: [{
              model: models.Products,
              required: true
            }],
            transaction: t
          }).then( items => {
            const completeOrders = [];
            orders.map(order => {
              order.items = items.filter( item => {
                return order.id === item.order_id
              })
              completeOrders.push(order);
            })
            res.render('orders', {
              orders: completeOrders
            })
          })
        })
      }).then(result => {

      }).catch(err => {
        console.error(err)
        res.render('error', {
          message: "Unable to retrieve orders at this time"
        })
      })
     }
     catch (err) {
       console.error(err);
       res.status(500).render('error', {message : 'An internal server error occured'});
     }
  },
  getProductCategories (req, res) {

  },
  deleteProductCategories (req, res) {

  },
  getAllProducts (req, res) {
    try {
     models.Products.findAll()
     .then(rows => {
        res.render('my_products', {products: rows});
     }).catch(err => {
       res.render('my_products', {
         error:"Error occured while fetching products, please reload the page"
       });
     })

    }
    catch (err) {
      console.error(err);
      res.status(500).render('error', {message : 'An internal server error occured'});
    }
  }
}
module.exports = controllers;


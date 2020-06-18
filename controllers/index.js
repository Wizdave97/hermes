const lib = require('../lib/webhookHandlers');
const { validationResult } = require('express-validator');
const models = require('../models');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { users } = require('../lib/cache');
const { fetchCart } = require('../lib/helpers');
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
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
        const cookieExpiration = 1000 * 24 * 60;
        const token = jwt.sign({email, password}, SECRET, { expiresIn: '24h'});
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
    const { sender_psid } = +req.query;
    const title = 'Checkout';
    if(sender_psid) {
      const {fullname, phone} = users[sender_psid];
      fetchCart(sender_psid)
      .then(rows => {
        const cart = rows.map(row =>({
          product_name: row.Product.product_name,
          img_url: row.Product.img_url,
          price: row.Product.price,
          quantity: row.quantity
        }))
        const totalPrice = cart.reduce((total=0, obj) => {
          return total+= (obj.quantity * price)
        })
        res.render('checkout', {
          cart, totalPrice, fullname, phone, title
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

  }
}
module.exports = controllers;


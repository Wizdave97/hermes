const lib = require('../lib');
const { validationResult } = require('express-validator');
const models = require('../models');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
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
  postMessage(req, res) {
    try{
      let body = req.body;

      // Checks this is an event from a page subscription
      if (body.object === 'page') {
    
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {
    
          // Gets the message. entry.messaging is an array, but 
          // will only ever contain one message, so we get index 0
          let webhook_event = entry.messaging[0];
          console.log(webhook_event);

          //Gets sender PSID
          let senderPsId = webhook_event.sender.id;
          console.log('Sender ID: ' + senderPsId)

          //Handle Webhook Event Types
          if (webhook_event.message) {
            lib.handleMessage(senderPsId, webhook_event.message);
          }
          else if (webhook_event.postback) {
            lib.handlePostback(senderPsId, webhook_event.postback);
          }
          else if (webhook_event.attachments) {
            let attachmentUrl = webhook_event.attachments[0].payload.url;
          }
        });
    
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
      } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
      }
    }
    catch (err) {
      console.error(err);
      res.sendStatus(500)
    }
  },
  getMessage(req, res) {
    try {
      
      // Your verify token. Should be a random string.
      let VERIFY_TOKEN = "aSecretToken"
          
      // Parse the query params
      let mode = req.query['hub.mode'];
      let token = req.query['hub.verify_token'];
      let challenge = req.query['hub.challenge'];
          
      // Checks if a token and mode is in the query string of the request
      if (mode && token) {
      
          // Checks the mode and token sent is correct
          if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          
          // Responds with the challenge token from the request
          console.log('WEBHOOK_VERIFIED');
          res.status(200).send(challenge);
          
          } else {
          // Responds with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);      
          }
      } 
    }
    catch (err) {
      console.error(err)
      res.sendStatus(500);
    }
  },
  addProduct(req, res, next) {
    try 
    {
      const errors = validationResult(req);
      if(req.file && errors.isEmpty()){
        const filePath = req.file.path.replace(new RegExp(`[\\${path.sep}]`, 'g'), '/').match(/images[/\w+-\d+.]+/g)[0];
        const img_url = `https://sheltered-headland-16417.herokuapp.com/${filePath}`;
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
        res.redirect('/webhook/product');
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
  }
}
module.exports = controllers;


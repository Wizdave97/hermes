var express = require('express');
const multer = require('multer');
const { body, query } = require('express-validator');
const path = require('path');
var router = express.Router();
const index = require('../controllers/index');
const { checkAuth, resizeImage } = require('../lib/helpers');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter(req, file, cb) {
      try
      {
        if (file)
        {
          const mimetype = file.mimetype.match(/(?:\/|\\)\w+$/)[0].replace(/[\\/]/, '');
          if (['png', 'jpeg', 'jpg'].indexOf(mimetype.trim()) <= -1)
          {
            cb('Only png or jpeg or jpg images are accepted', false);
            return null;
          }
          cb(null, true);
          return null;
        }
        cb(new multer.MulterError(400, 'No file uploaded'), false);
        return null;
      }
      catch (err)
      {
        cb(new multer.MulterError(400, 'file upload error'), false);
        return null;
      }
    },
    limits: {
      fileSize: 3 * 1000000,
    },
  });
  
  function checkFile(req, res, next) {
    if (!req.file) req.file = false;
    next();
  }


router.post('/categories', checkAuth,[
    body('categories').isString().isLength({min: 2}).escape().trim()
], index.postCategories);
router.post('/product', checkAuth, upload.single('img'), [
    body('category').isNumeric(),
    body('product_name').isString().isLength({min: 3}).escape().trim(),
    body('price').isNumeric(),
    body('stock').isNumeric()
], checkFile, resizeImage, index.addProduct);
router.get('/product', checkAuth, index.getAddProduct);
router.get('/categories', checkAuth, function(req, res) {
    res.render('add_categories', {title: 'Product Categories'});
});
router.get('/login', function(req, res) {
    req.locals = {}
    res.render('login', {title: 'Bot Admin Login'});
});
router.post('/login', index.login);
router.get('/checkout', index.getCheckout);
router.post('/checkout', [
  body('sender_psid', 'sender_psid required').isNumeric(),
  body('fullname').isLength({min: 4, max:665}).escape().trim(),
  body('email', 'email is required').isEmail().escape().trim(),
  body('order_number', 'order_number must be a big int').isNumeric(),
  body('paid', 'paid must be true').isBoolean(),
  body('address', 'address is required').isLength({min: 3, max:1600}).escape().trim(),
  body('phone', 'phone number is required').isLength({min:11, max:13}).escape().trim(),
  body('transaction_ref', 'transation reference is required').isLength({min:5}).escape().trim()
], index.postCheckout);
router.get('/editProduct', checkAuth, [query('id').isNumeric()], index.getEditProduct);
router.post('/editProduct', checkAuth, [
    query('id').isNumeric(),
    body('product_name').isString().isLength({min: 3}).escape().trim(),
    body('price').isNumeric(),
    body('stock').isNumeric(),
    body('category').isNumeric()
], index.putProduct);
router.get('/orders', checkAuth, index.getOrders);
router.get('/productCategories', checkAuth, index.getProductCategories);
router.delete('/productCategories', checkAuth, index.deleteProductCategories);
router.get('/allProducts', checkAuth, index.getAllProducts);

module.exports = router;

var express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const path = require('path');
var router = express.Router();
const index = require('../controllers/index');
const { checkAuth, resizeImage } = require('../lib/helpers');

// const storage = multer.diskStorage({
//     destination: path.resolve(process.cwd(), 'public/images'),
//     filename(req, file, cb) {
//       try
//       {
//         if (file)
//         {
//           const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${file.mimetype.match(/(?:\/|\\)\w+$/)[0].replace(/[\\/]/, '')}`;
//           cb(null, `${file.fieldname}-${uniqueSuffix}`.trim());
//         }
//         else cb(new multer.MulterError(400, 'No file uploaded'));
//       }
//       catch (err)
//       {
//         cb(new multer.MulterError(400, 'file upload error'));
//       }
//     },
//   });
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

router.post('/', index.postMessage);
router.get('/', index.getMessage);
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
router.post('/login', index.login)

module.exports = router;

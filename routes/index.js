var express = require('express');
var router = express.Router();
const index = require('../controllers/index');

/* GET home page. */
router.post('/', index.postMessage)
router.get('/', index.getMessage);

module.exports = router;

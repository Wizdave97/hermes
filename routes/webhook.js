var express = require('express');
const webhook = require('../controllers/webhook');

const router = express.Router()
router.post('/', webhook.postMessage);
router.get('/', webhook.getMessage);

module.exports = router
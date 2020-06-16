const admin = require("firebase-admin");

var serviceAccount = require("../sac.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "ecommerce-bot-e6961.appspot.com"
  });
const bucket = admin.storage().bucket();

module.exports = bucket;
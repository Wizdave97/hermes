const jwt = require('jsonwebtoken')
module.exports = {
    checkAuth(req, res, next) {
        let token = null;
        if (req && req.cookies)
        {
          token = req.cookies.token;
          try {
              decoded = jwt.verify(token, process.env.SECRET);
              if (decoded.email) {
                  res.locals.token = token;
                  next()
              }
          }
          catch(err){
              res.redirect('/webhook/login')
          } 
        }
      }
}
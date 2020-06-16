const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const models = require('../models');
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
      },
    getProducts(category, page) {
        return new Promise((resolve, reject) => {
            models.Products.findAndCountAll({
                include: [{
                    model: models.Categories,
                    required: true,
                    category:{
                        [Sequelize.Op.like] : `%${category}%`
                    }
                }],
                limit: 10,
                offset: (page - 1) * 10
            }).then((result) => {
                const totalPages = Math.floor(result.count / 10)
                resolve({rows: result.rows, pages: totalPages});
            }).catch(err => {
                reject(err);
            })
        })
    }
}
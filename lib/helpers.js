const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const models = require('../models');
const sharp = require('sharp');
const path = require('path');
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
                    where:{
                            category:{
                            [Sequelize.Op.like] : `%${category}%`
                        }
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
    },
    resizeImage(req, res, next) {
        if(req.file)   
        {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${req.file.mimetype.match(/(?:\/|\\)\w+$/)[0].replace(/[\\/]/, '')}`;
            const name = `${req.file.fieldname}-${uniqueSuffix}`.trim();
            const filePath = path.join(__dirname, '../public/images/'+ name);
            sharp(req.file.buffer)
            .resize({ height: 600 })
            .toFile(filePath)
            .then(() => {
                req.file.path = filePath;
                next();
                // 100 pixels wide, auto-scaled height  
            });
        }
        else next();  
    }
}
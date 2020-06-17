const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const models = require('../models');
const sharp = require('sharp');
const path = require('path');  
const bucket = require('../lib/firebase_config');




  

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
                const totalPages = Math.floor(result.count / 10) - 1;
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
            sharp(req.file.buffer)
            .resize({ height: 600 })
            .toBuffer()
            .then((buffer) => {
               
                  const file = bucket.file(name);
                  const stream = file.createWriteStream({
                    metadata: {
                      contentType: req.file.mimetype
                    },
                    resumable: false
                  });
                  stream.on('error', (err) => {
                    req.file = false;
                    next();
                  });
                
                  stream.on('finish', () => {
                    req.file.cloudStorageObject = name;
                    file.makePublic().then(() => {
                      req.file.cloudStoragePublicUrl = `https://storage.googleapis.com/ecommerce-bot-e6961.appspot.com/${name}`;
                      next();
                    }).catch(()=> {
                        req.file = false;
                        file.delete().then(()=>{}).catch(err =>{});
                    });
                  });
                  stream.end(buffer);
                 
            }).catch(err => {
                req.file = false;
                console.error(err);
                next();
            });
        }
        else next();  
    }
}
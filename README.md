# hermes
An ecommerce bot for messenger

# Installing bot
Clone the repository
Install all dependencies using `npm install`
Create a facebook application using the guide here https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
Once it's all setup
Create a postgres database on any server
Go into the sequelize config and change the db information to match the db you created on your server
Deploy the application to a cloud service such as Heroku.
Run all migrations by running this `npx sequelize-cli db:migrate`
The login details are hard coded in the app, you can extend the app by creating a user database and a full authentication system using passport.js

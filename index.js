let express = require('express')
require('dotenv').config()
let bodyparser = require('body-parser')
let session = require('express-session')
let cookie = require('cookie-parser')
let upload = require('express-fileupload')
let User_route = require('./Routes/user')
let Admin_route = require('./Routes/admin')
// let session = require("express-session");
// require("dotenv").config();

let app = express()
app.use(bodyparser.urlencoded({ extended: true }))
app.use(express.static('public/'))
app.use(upload())
app.use(cookie())
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: 'asdfghjkl'
  })
)

app.use('/', User_route)
app.use('/admin', Admin_route)

app.listen(process.env.PORT || 1000)

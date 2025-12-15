let express = require('express')
let route = express.Router()
let exe = require('../Connection')
let url = require('url')
const e = require('express')
const { Script } = require('vm')


route.get('/', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')
  var slider = await exe('SELECT * FROM SLIDER')
  var obj = {
    about_company: about_company,
    slider: slider,
    is_login: verify(req)
  }
  res.render('user/index.ejs', obj)
})
route.get('/about', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')
  var about_us = await exe('SELECT * FROM about_us')
  var obj = {
    about_company: about_company,
    about_us: about_us,
    is_login: verify(req)
  }
  res.render('user/about.ejs', obj)
})
route.get('/shop', async function (req, res) {
  var url_data = url.parse(req.url, true).query
  var cond = ''
  if (url_data.category) {
    cond = ` WHERE product_category = '${url_data.category}' `
  }
  if (url_data.color) {
    cond = ` WHERE product_color = '${url_data.color}' `
  }
  if (url_data.company) {
    cond = ` WHERE product_company = '${url_data.company}' `
  }
  if (url_data.product_name) {
    cond = ` WHERE product_name LIKE '%${url_data.product_name}%' `
  }

  // console.log(cond);

  var about_company = await exe('SELECT * FROM company_details')
  var category = await exe('SELECT * FROM category')
  var company_name = await exe(
    `SELECT product_company FROM product GROUP BY product_company`
  )
  var company_color = await exe(
    `SELECT product_color FROM product GROUP BY product_color`
  )
  var product = await exe(
    `SELECT * ,
     (SELECT MIN(product_price) FROM product_prissing WHERE product.id = product_prissing.product_id AND product_price > 0  ) AS price ,
     (SELECT MAX(product_duplicate_price) FROM product_prissing WHERE product.id = product_prissing.product_id ) AS product_duplicate_price  FROM product` +
      cond
  )
  // console.log(product);

  var obj = {
    about_company: about_company,
    category: category,
    company_name: company_name,
    company_color: company_color,
    product: product,
    is_login: verify(req)
  }
  res.render('user/shop.ejs', obj)
})
route.get('/blog', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')
  var obj = { about_company: about_company, is_login: verify(req) }
  res.render('user/blog.ejs', obj)
})
route.get('/contact', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')
  var obj = { about_company: about_company, is_login: verify(req) }
  res.render('user/contact.ejs', obj)
})
route.get('/view_product/:id', async function (req, res) {
  var id = req.params.id
  var about_company = await exe('SELECT * FROM company_details')
  var product = await exe(`SELECT * FROM product WHERE id = '${id}'`)
  var product_prissing = await exe(
    `SELECT * FROM product_prissing WHERE product_id = '${id}'`
  )
  // console.log(product,product_prissing);
  var obj = {
    about_company: about_company,
    product: product,
    product_prissing: product_prissing,
    is_login: verify(req)
  }
  res.render('user/view_product.ejs', obj)
})

//       -------------- login ----------------------------------------------------------------

route.get('/login', async function (req, res) {
  var url_data = url.parse(req.url, true).query
  var product_id = url_data.product_id
  var about_company = await exe('SELECT * FROM company_details')
  var obj = {
    about_company: about_company,
    product_id: product_id,
    is_login: verify(req)
  }
  res.render('user/login.ejs', obj)
})
route.get('/create_account', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')
  var obj = { about_company: about_company, is_login: verify(req) }
  res.render('user/create_account.ejs', obj)
})
route.post('/create_account', async function (req, res) {
  var d = req.body
  var sql = await exe(
    `INSERT INTO user (user_name,user_mobile,user_email,password) VALUES ('${d.user_name}','${d.user_mobile}','${d.user_email}','${d.password}')`
  )
  res.redirect('/login')
})
route.post('/verify_user', async function (req, res) {
  var d = req.body
  var data = await exe(
    `SELECT * FROM user WHERE user_mobile = '${d.user_mobile}' AND password = '${d.password}' `
  )
  //   res.send(data);
  if (data.length > 0) {
    req.session.user_id = data[0].id
    //     console.log(req.session.user_id);
    if (d.product_id == '') {
      res.redirect('/shop')
    } else {
      res.redirect(`/view_product/${d.product_id}?msg=login_success`)
    }
  } else {
    res.redirect(`/login?product_id=${d.product_id}`)
  }
})
route.get('/logout', function (req, res) {
  req.session.user_id = undefined
  res.redirect('/')
})

function verify (req, res, next) {
  var user_id = req.session.user_id
  // console.log('id = ', user_id)
  if (user_id == undefined) {
    return false
  } else {
    return true
  }
}

//               -------------------------------   cart -----------------------------------

route.get(
  '/add_to_cart/:product_id/:product_prissing_id',
  async function (req, res) {
    var product_id = req.params.product_id
    var product_prissing_id = req.params.product_prissing_id
    var user_id = req.session.user_id

    var sql = `INSERT INTO cart (product_id,product_prissing_id,user_id,quantity) VALUES ('${product_id}','${product_prissing_id}','${user_id}',1)`

    var data = await exe(sql)
    res.redirect('/shop')
  }
)

route.get('/cart', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')

  var sql = `SELECT * FROM product,product_prissing,cart
  WHERE product.id= product_prissing.product_id 
  AND product.id = cart.product_id
  AND product_prissing.id=cart.product_prissing_id
  AND cart.user_id = '${req.session.user_id}'

  `
  var cart = await exe(sql)
  // res.send(cart);
  var obj = { about_company: about_company, cart: cart, is_login: verify(req) }
  // req.session.user_id = 1
  if (req.session.user_id == undefined) {
    res.redirect('/login')
  } else {
    res.render('user/cart.ejs', obj)
  }
})
route.get('/increase_qnt/:cart_id', async function (req, res) {
  var cart_id = req.params.cart_id
  var sql = `UPDATE cart SET quantity = quantity + 1 WHERE id = '${cart_id}'`
  var data = await exe(sql)
  // res.send(data);
  res.redirect('/cart')
})
route.get('/decrease_qnt/:cart_id', async function (req, res) {
  var cart_id = req.params.cart_id
  var sql = `UPDATE cart SET quantity = quantity - 1 WHERE id = '${cart_id}' AND quantity > 1`
  var data = await exe(sql)

  res.redirect('/cart')
})
route.get('/delete_cart/:cart_id', async function (req, res) {
  var cart_id = req.params.cart_id
  var sql = `DELETE FROM cart WHERE id ='${cart_id}'`
  var data = await exe(sql)
  res.redirect('/cart')
})

//  ----------------------------------------------------   profile   ----------------------------------------

route.get('/profile', async function (req, res) {
  var about_company = await exe(`SELECT * FROM company_details `)
  var user = await exe(`SELECT * FROM user WHERE id = "${req.session.user_id}"`)
  var obj = { about_company: about_company, user: user, is_login: verify(req) }

  if (req.session.user_id == undefined) {
    res.redirect('/login')
  } else {
    res.render('user/profile.ejs', obj)
  }
})

route.get('/update_user/:id', async function (req, res) {
  var id = req.params.id
  var about_company = await exe('SELECT * FROM company_details')
  var user = await exe(`SELECT * FROM user WHERE id = "${req.session.user_id}"`)
  var obj = { about_company: about_company, user: user, is_login: verify(req) }
  if (req.session.user_id == undefined) {
    res.redirect('/login')
  } else {
    res.render('user/update_user.ejs', obj)
  }
})
route.post('/update_user', async function (req, res) {
  var d = req.body
  if (req.files && req.files.profile_image) {
    var FileName = Date.now() + req.files.profile_image.name
    req.files.profile_image.mv('Public/uploads/' + FileName)
    var sql = `UPDATE user SET profile_image = '${FileName}' WHERE id = '${d.id}'; `
    var data = await exe(sql)
  }
  var sql1 = `UPDATE user SET 
  user_name = '${d.user_name}',
  user_mobile = '${d.user_mobile}',
  user_email = '${d.user_email}',
  gender = '${d.gender}',
  date_of_birth = '${d.date_of_birth}',
  address = '${d.address}'
  WHERE id  = '${d.id}'
  `
  var data = await exe(sql1)
  res.redirect('/profile')
})

//  -------------------------------------------           check oout ------------------------

route.get('/checkout', async function (req, res) {
  var cart = `SELECT * FROM cart,product,product_prissing WHERE 
  product.id = product_prissing.product_id AND
  product.id = cart.product_id AND
  product_prissing.id = cart.product_prissing_id AND 
  user_id = '${req.session.user_id}' 

  `
  var cart = await exe(cart)
  var about_company = await exe('SELECT * FROM company_details')
  var obj = { about_company: about_company, cart: cart, is_login: verify(req) }

  if (req.session.user_id == undefined) {
    res.redirect('/login')
  } else {
    res.render('user/checkout.ejs', obj)
  }
  // res.send(cart);
})
route.post('/order', async function (req, res) {
  var d = req.body
  var cart = `SELECT * FROM cart,product,product_prissing WHERE 
  product.id = product_prissing.product_id AND
  product.id = cart.product_id AND
  product_prissing.id = cart.product_prissing_id AND 
  user_id = '${req.session.user_id}'
  `
  var cart = await exe(cart)
  var total_amount = 0
  for (var i = 0; i < cart.length; i++) {
    total_amount += cart[i].product_price * cart[i].quantity
  }
  var order_date = new Date().toISOString().slice(0, 10)
  // console.log(order_date);
  var order = `INSERT INTO order_table (user_id,customer_name,customer_mobile,customer_state,customer_district,customer_city,customer_area,customer_landmark,customer_pincode,payment_mode,total_amount,order_date,order_status,payment_status) VALUES ('${req.session.user_id}','${d.customer_name}','${d.customer_mobile}','${d.customer_state}','${d.customer_district}','${d.customer_city}','${d.customer_area}','${d.customer_landmark}','${d.customer_pincode}','${d.payment_mode}','${total_amount}','${order_date}','pending','pending')`
  var order = await exe(order)

  var order_id = order.insertId

  for (let i = 0; i < cart.length; i++) {
    var order_detail = `INSERT INTO order_details (order_id,user_id,product_id,product_prissing_id,product_name,product_company,product_image1,product_color,product_price,product_size,product_quantity,product_amount) VALUES 
    (
      '${order_id}',
      '${req.session.user_id}',
      '${cart[i].product_id}',
      '${cart[i].product_prissing_id}',
      '${cart[i].product_name}',
      '${cart[i].product_company}',
      '${cart[i].product_image1}',
      '${cart[i].product_color}',
      '${cart[i].product_price}',
      '${cart[i].product_size}',
      '${cart[i].quantity}',
      '${cart[i].product_price * cart[i].quantity}'
    )
    `
    var order_detail = await exe(order_detail)
  }

  var delete_cart = `DELETE FROM cart WHERE user_id = '${req.session.user_id}'`
  var delete_cart = await exe(delete_cart)
  if (req.session.user_id == undefined) {
    res.redirect('/login')
  } else if (d.payment_mode == 'online') {
    res.redirect(`/payment/${order_id}`)
  } else {
    res.redirect(`/order_info/${order_id}`)
  }
})

route.get('/order_info/:order_id', async function (req, res) {
  var order_id = req.params.order_id
  var order_table = `SELECT * FROM order_table WHERE order_id = '${order_id}' `
  var order_data = await exe(order_table)
  var order_details = await exe(
    `SELECT * FROM order_details WHERE order_id = '${order_id}'`
  )

  // console.log(order_details);
  // res.send(order_data);
  var about_company = await exe('SELECT * FROM company_details')
  var obj = {
    about_company: about_company,
    is_login: verify(req),
    order_data: order_data,
    order_details: order_details
  }
  if (req.session.user_id == undefined) {
    //  console.log(req.session.user_id);
    res.redirect('/login')
  } else {
    res.render('user/order_info.ejs', obj)
  }
})

//    ---------------------------------       order products     ---------------------------------------------------

route.get('/ordered_products', async function (req, res) {
  var about_company = await exe('SELECT * FROM company_details')
  var orders = await exe(
    `SELECT * FROM order_table WHERE user_id = '${req.session.user_id}'`
  )

  // res.send(order_data)
  var obj = {
    about_company: about_company,
    is_login: verify(req),
    orders: orders
  }
  if (req.session.user_id == undefined) {
    res.redirect('/login')
  } else {
    res.render('user/order_products.ejs', obj)
  }
})
route.get('/order_details/:order_id', async function (req, res) {
  var order_id = req.params.order_id

  var about_company = await exe('SELECT * FROM company_details')
  var order_data = await exe(
    `SELECT * FROM order_details , order_table WHERE order_table.order_id = order_details.order_id AND  order_details.order_id ='${order_id}' AND order_details.user_id='${req.session.user_id}' `
  )
  // console.log(order_data);
  // res.send(order_data);
  var obj = {
    about_company: about_company,
    is_login: verify(req),
    order_data: order_data
  }
  res.render('user/order_details.ejs', obj)
})

route.get('/cancel_order/:order_id', async function (req, res) {
  var order_id = req.params.order_id

  var today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  var data = await exe(
    `UPDATE order_table SET order_status = 'cancelled',  cancelled_date = '${today}' WHERE order_id = '${order_id}' `
  )
  res.redirect('/ordered_products')
})

//  ------------------------------------      payment   ------------------------------------------------

route.get('/payment/:order_id', async function (req, res) {
  var order_id = req.params.order_id
  var order_data = await exe(
    `SELECT * FROM order_table WHERE order_id = '${order_id}'`
  )
  // res.send(order_data);
  // console.log(order_data);
  var obj = { order_data: order_data, user_id: req.session.user_id }
  res.render('user/payment.ejs', obj)
})

route.post('/payment_details/:order_id/:user_id', async function (req, res) {
  var user_id = req.params.user_id
  req.session.user_id = user_id
  var order_id = req.params.order_id
  var payment_id = req.body.razorpay_payment_id

  var data = await exe(`
    UPDATE order_table
    SET transaction_id='${payment_id}',
        payment_status='successful'
    WHERE order_id='${order_id}'
  `)
  // res.send(data);
  res.redirect('/order_info/' + order_id)
})

module.exports = route

// CREATE TABLE cart (
//   id INT PRIMARY KEY AUTO_INCREMENT,
//   product_id INT,
//   product_prissing_id INT,
//   user_id INT,
//   quantity INT
// );

// CREATE TABLE order_table (
//  id INT PRIMARY KEY AUTO_INCREMENT ,
//  customer_name VARCHAR(100),
//  customer_mobile VARCHAR(100),
//  customer_state VARCHAR(100),
//  customer_district VARCHAR(100),
//  customer_city VARCHAR(100),
//  customer_area VARCHAR(100),
//  customer_landmark VARCHAR(100),
//  customer_pincode VARCHAR(100),
//  payment_mode VARCHAR(50),
//  total_amount INT,
//  order_date DATE,
//  order_status VARCHAR(50),
//  payment_status VARCHAR(50)
// )

// CREATE TABLE order_details (
//   id INT PRIMARY KEY AUTO_INCREMENT,

//   order_id INT,
//   user_id INT,
//   product_id INT,
//   product_prissing_id INT,

//   product_name VARCHAR(100),
//   product_company VARCHAR(100),
//   product_image1 TEXT,
//   product_color VARCHAR(50),
//   product_size VARCAHR(50),

//   product_price INT,
//   product_quantity INT,
//   product_amount INT,
// );

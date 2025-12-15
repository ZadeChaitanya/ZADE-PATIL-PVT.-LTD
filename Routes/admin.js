let express = require('express')
let route = express.Router()
let exe = require('./../Connection')
let jwt = require('jsonwebtoken')
let KEY = 'zadepatilpvt.ltd.'

route.get('/', function (req, res) {
  res.render('admin/login.ejs')
})
// route.get('/create_account', function (req, res) {
//   res.render('admin/create_account.ejs')
// })
// route.post('/create_account', async function (req, res) {
//   var d = req.body
//   var FileName = Date.now() + req.files.admin_photo.name
//   req.files.admin_photo.mv('public/admin/images/' + FileName)
//   var sql = `INSERT INTO admin (admin_name,admin_mobile,admin_email,admin_gender,admin_dob,admin_photo,admin_address,admin_password) VALUES ('${d.admin_name}','${d.admin_mobile}','${d.admin_email}','${d.admin_gender}','${d.admin_dob}','${FileName}','${d.admin_address}','${d.admin_password}')`
//   var data = await exe(sql)
//   res.redirect('/admin/')
// })
route.post('/verify_admin', async function (req, res) {
  var d = req.body
  var sql = `SELECT * FROM admin WHERE admin_mobile ='${d.admin_mobile}' AND admin_password = '${d.admin_password}' `
  var data = await exe(sql)
  // var token = jwt.sign({admin_id:"data[0].id"},KEY);
  // res.cookie("token",token);
  if(data.length > 0){
    req.session.admin_id = data[0].id;
    res.redirect('/admin/home')
  }
  else{
    res.redirect("/admin");
  }
  // res.send(req.session.admin_id);
})

function verify_admin (req, res, next) {
  let token = req.session.admin_id
  if (token == undefined) {
    res.redirect('/admin')
  } else {
    next()
  }
  // res.send("yes");
  // jwt.verify(token,KEY);
}

route.get('/home', verify_admin, async function (req, res) {
  //   res.render('admin/index.ejs')
  // })
  // route.get('/', async function (req, res) {
  var total_orders = await exe(`SELECT COUNT(order_id) FROM order_table`)
  var pending_orders = await exe(
    `SELECT COUNT(order_id) FROM order_table WHERE order_status = 'pending' `
  )
  var delivered_orders = await exe(
    `SELECT COUNT(order_id) FROM order_table WHERE order_status = 'delivered' `
  )
  var total_revenue = await exe(
    `SELECT SUM(total_amount) FROM order_table WHERE order_status = 'delivered' `
  )
  total_orders = total_orders[0]['COUNT(order_id)']
  pending_orders = pending_orders[0]['COUNT(order_id)']
  delivered_orders = delivered_orders[0]['COUNT(order_id)']
  total_revenue = total_revenue[0]['SUM(total_amount)']
  var total_users = await exe(`SELECT COUNT(id) FROM user`)
  total_users = total_users[0]['COUNT(id)']
  var total_products = await exe(`SELECT COUNT(id) FROM product`)
  total_products = total_products[0]['COUNT(id)']
  var recent_orders = await exe(
    `SELECT * FROM order_table WHERE order_status='dispatched' OR order_status='delivered' OR order_status='pending' `
  )
  // console.log(total_products);
  var obj = {
    total_orders: total_orders,
    total_users: total_users,
    total_products: total_products,
    recent_orders: recent_orders,
    pending_orders: pending_orders,
    delivered_orders: delivered_orders,
    total_revenue: total_revenue
  }
  res.render('admin/index.ejs', obj)
})

route.get('/about_company', verify_admin, async function (req, res) {
  var data = await exe('SELECT * FROM company_details')
  var obj = { about_company: data }
  res.render('admin/about_company.ejs', obj)
})
route.post('/about_company', verify_admin, async function (req, res) {
  var d = req.body
  var sql = `UPDATE company_details SET 
     company_name = '${d.company_name}',        
     company_mobile = '${d.company_mobile}',
     company_email = '${d.company_email}',
     address = '${d.address}',
     company_whatsapp = '${d.company_whatsapp}',
     company_linkedin = '${d.company_linkedin}',
     company_facebook = '${d.company_facebook}',
     company_youtube = '${d.company_youtube}'
     `
  var data = await exe(sql)
  // res.send(data);
  res.redirect('/admin/about_company')
})
route.get('/about_us', verify_admin, async function (req, res) {
  var data = await exe('SELECT * FROM about_us')
  var obj = { about_us: data }
  res.render('admin/about_us.ejs', obj)
})
route.post('/about_us', verify_admin, async function (req, res) {
  var d = req.body
  if (req.files) {
    if (req.files.background_image) {
      var FileName = Date.now() + req.files.background_image.name
      req.files.background_image.mv('public/admin/images/' + FileName)
      var sql = `UPDATE about_us SET background_image = '${FileName}'`
      var data = await exe(sql)
    }
    if (req.files.side_image) {
      var FileName = Date.now() + req.files.side_image.name
      req.files.side_image.mv('public/admin/images/' + FileName)
      var sql = `UPDATE about_us SET side_image = '${FileName}'`
      var data = await exe(sql)
    }
  }
  var sql = `UPDATE about_us SET 
          heading = '${d.heading}',
          details = '${d.details}',
          button_text = '${d.button_text}',
          button_link = '${d.button_link}'
    `
  var data = await exe(sql)
  res.redirect('/admin/about_us')
})

route.get('/slider', verify_admin, function (req, res) {
  res.render('admin/slider.ejs')
})
route.get('/add_slider', verify_admin, function (req, res) {
  res.render('admin/add_slider.ejs')
})
route.post('/add_slider', verify_admin, async function (req, res) {
  var d = req.body
  var FileName = Date.now() + req.files.slider_image.name
  req.files.slider_image.mv('public/admin/images/' + FileName)

  var sql = `INSERT INTO slider (slider_heading,slider_info,slider_image,button_text,button_url) VALUES ('${d.slider_heading}','${d.slider_info}','${FileName}','${d.button_text}','${d.button_url}') `
  var data = await exe(sql)
  res.redirect('/admin/add_slider')
})
route.get('/view_slider', verify_admin, async function (req, res) {
  var data = await exe('SELECT * FROM slider')
  var obj = { slider: data }
  res.render('admin/view_slider.ejs', obj)
})
route.get('/delete_slider/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var sql = `DELETE FROM slider WHERE id = '${id}'`
  var data = await exe(sql)
  res.redirect('/admin/view_slider')
})
route.get('/edit_slider/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var data = await exe(`SELECT * FROM slider WHERE id ='${id}' `)
  var obj = { slider: data }
  res.render('admin/edit_slider.ejs', obj)
})
route.post('/update_slider', verify_admin, async function (req, res) {
  var d = req.body
  if (req.files) {
    var FileNewName = Date.now() + req.files.slider_image.name
    req.files.slider_image.mv('public/admin/images/' + FileNewName)
    var sql = `UPDATE slider SET slider_image = '${FileNewName}' WHERE id = '${d.id}' ;`
    var data = await exe(sql)
    // res.send(sql);
  }
  var sql = `UPDATE slider SET 
     slider_heading = '${d.slider_heading}' ,
      slider_info = '${d.slider_info}' ,
      button_text = '${d.button_text}', 
     button_url = '${d.button_url}'
      
      WHERE id ='${d.id}'`
  var data = await exe(sql)
  res.redirect('/admin/view_slider')
})
route.get('/category', verify_admin, async function (req, res) {
  var data = await exe('SELECT * FROM category')
  res.render('admin/category.ejs', { data })
})
route.post('/category', verify_admin, async function (req, res) {
  var data = await exe(
    `insert into category (category) VALUES ('${req.body.category}')`
  )
  res.redirect('/admin/category')
})
route.get('/edit_category/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var data = await exe(`SELECT * FROM category WHERE id = '${id}'`)
  res.render('admin/update_category.ejs', { data })
})
route.get('/delete_category/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var data = await exe(`DELETE  FROM category WHERE id = '${id}'`)
  res.redirect('/admin/category')
})
route.post('/update_category', verify_admin, async function (req, res) {
  var data = await exe(
    `UPDATE category SET category = '${req.body.category}' WHERE id = '${req.body.id}'`
  )
  res.redirect('/admin/category')
})
route.get('/shop', function (req, res) {
  res.render('admin/shop.ejs')
})
route.get('/add_product', verify_admin, async function (req, res) {
  var category = await exe(`SELECT * FROM category`)
  var obj = { category: category }
  res.render('admin/add_product.ejs', obj)
})
route.post('/add_product', verify_admin, async function (req, res) {
  var d = req.body
  if (req.files && req.files.product_image1) {
    var product_image1 = Date.now() + req.files.product_image1.name
    req.files.product_image1.mv('public/uploads/' + product_image1)
  }
  if (req.files && req.files.product_image2) {
    var product_image2 = Date.now() + req.files.product_image2.name
    req.files.product_image2.mv('public/uploads/' + product_image2)
  }
  if (req.files && req.files.product_image3) {
    var product_image3 = Date.now() + req.files.product_image3.name
    req.files.product_image3.mv('public/uploads/' + product_image3)
  } else {
    product_image3 = ''
  }
  if (req.files && req.files.product_image4) {
    var product_image4 = Date.now() + req.files.product_image4.name
    req.files.product_image4.mv('public/uploads/' + product_image4)
  } else {
    product_image4 = ''
  }

  var sql = `INSERT INTO product (product_category,product_name,product_company,product_color,product_label,product_details,product_image1,product_image2,product_image3,product_image4) VALUES (?,?,?,?,?,?,?,?,?,?)`
  var data = await exe(sql, [
    d.product_category,
    d.product_name,
    d.product_company,
    d.product_color,
    d.product_label,
    d.product_details,
    product_image1,
    product_image2,
    product_image3,
    product_image4
  ])

  var product_id = data.insertId
  for (let i = 0; i < d.product_size.length; i++) {
    var sql1 = `INSERT INTO product_prissing (product_id,product_size,product_price,product_duplicate_price) VALUES ('${product_id}','${d.product_size[i]}','${d.product_price[i]}','${d.product_duplicate_price[i]}')`
    var data1 = await exe(sql1)
    // console.log(product_id);
  }
  res.redirect('/admin/add_product')
})
route.get('/product_list', verify_admin, async function (req, res) {
  // SELECT * FROM product;
  var sql = `SELECT * ,
  (SELECT MIN(product_price) FROM product_prissing WHERE product_prissing.product_id = product.id) AS price,
  (SELECT MAX(product_duplicate_price) FROM product_prissing WHERE product_prissing.product_id = product.id) AS duplicate_price
  FROM product
  `
  var product = await exe(sql)
  // res.send(data);
  var obj = { product: product }
  res.render('admin/view_product.ejs', obj)
})

route.get('/product_info/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var product = await exe(`SELECT * FROM product WHERE id = '${id}'`)
  var product_prissing = await exe(
    `SELECT * FROM product_prissing WHERE product_id = '${id}'`
  )

  var obj = { product: product, product_prissing: product_prissing }
  res.render('admin/product_info.ejs', obj)
})
route.get('/edit_info/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var sql = `SELECT * FROM category`
  var sql1 = ` SELECT * FROM  product WHERE id = '${id}'`
  var sql2 = ` SELECT * FROM  product_prissing WHERE product_id = '${id}'`
  var category = await exe(sql)
  var product = await exe(sql1)
  var product_prissing = await exe(sql2)
  var obj = {
    category: category,
    product: product,
    product_prissing: product_prissing
  }
  // console.log(product_prissing)
  res.render('admin/edit_product.ejs', obj)
})
route.post('/update_product', verify_admin, async function (req, res) {
  var d = req.body
  if (req.files && req.files.product_image1) {
    var product_image1 = Date.now() + req.files.product_image1.name
    req.files.product_image1.mv('public/uploads/' + product_image1)
    var sql = `UPDATE product SET product_image1='${product_image1}' WHERE id = '${d.id}' `
    var data = await exe(sql)
  }
  if (req.files && req.files.product_image2) {
    var product_image2 = Date.now() + req.files.product_image2.name
    req.files.product_image2.mv('public/uploads/' + product_image2)
    var sql = `UPDATE product SET product_image2='${product_image2}' WHERE id = '${d.id}' `
    var data = await exe(sql)
  }
  if (req.files && req.files.product_image3) {
    var product_image3 = Date.now() + req.files.product_image3.name
    req.files.product_image3.mv('public/uploads/' + product_image3)
    var sql = `UPDATE product SET product_image3='${product_image3}' WHERE id = '${d.id}' `
    var data = await exe(sql)
  }
  if (req.files && req.files.product_image4) {
    var product_image4 = Date.now() + req.files.product_image4.name
    req.files.product_image4.mv('public/uploads/' + product_image4)
    var sql = `UPDATE product SET product_image4='${product_image4}' WHERE id = '${d.id}' `
    var data = await exe(sql)
  }
  var sql1 = ` UPDATE product SET 
  product_category = '${d.product_category}',
  product_name = '${d.product_name}',
  product_company = '${d.product_company}',
  product_color = '${d.product_color}',
  product_label = '${d.product_label}',
  product_details = '${d.product_details}'
  WHERE id = '${d.id}' 
  `
  var data = await exe(sql1)
  // console.log(d.product_size.length );
  var abc = d.pr_id
  for (let i = 0; i < d.product_size.length; i++) {
    var sql = `UPDATE product_prissing SET 
    product_price = '${d.product_price[i]}',
    product_duplicate_price = '${d.product_duplicate_price[i]}'
    WHERE id = '${abc}' `
    abc++
    var data = await exe(sql)
  }

  res.redirect(`/admin/product_info/${d.id}`)
})
route.get('/delete_info/:id', verify_admin, async function (req, res) {
  var id = req.params.id
  var data1 = await exe(`DELETE FROM product WHERE id  = '${id}' `)
  var data2 = await exe(
    `DELETE FROM product_prissing WHERE product_id  = '${id}' `
  )
  res.redirect(`/admin/product_list`)
})

route.get('/view_orders', verify_admin, async function (req, res) {
  res.render('admin/view_order.ejs')
})
route.get('/view_orders/:status', verify_admin, async function (req, res) {
  // res.send(req.params)
  var status = req.params.status
  if (status == 'all') {
    var orders = await exe(
      `SELECT * FROM order_table WHERE order_status!= 'delivered' `
    )
  } else {
    var orders = await exe(
      `select * from order_table WHERE order_status='${status}' `
    )
  }

  // console.log(status)
  var obj = { status: status, orders: orders }
  res.render('admin/view_order_list.ejs', obj)
})

route.get(
  '/view_order_detail/:order_id/:status',
  verify_admin,
  async function (req, res) {
    var order_id = req.params.order_id
    var status = req.params.status
    var order_data = await exe(
      `SELECT * FROM order_table , order_details WHERE order_table.order_id = order_details.order_id AND order_status = '${status}' AND order_details.order_id = '${order_id}' `
    )
    // res.send(order_data);

    var obj = { order_data: order_data }
    res.render('admin/view_order_detail.ejs', obj)
  }
)
route.get(
  '/transfer/:order_id/:status',
  verify_admin,
  async function (req, res) {
    var order_id = req.params.order_id
    var status = req.params.status

    const today = new Date().toISOString().slice(0, 10)
    if (status == 'dispatched')
      var sql = `UPDATE order_table SET order_status="dispatched" , dispatched_date="${today}"  WHERE order_id ='${order_id}'  `
    else if (status == 'delivered')
      var sql = `UPDATE order_table SET order_status="delivered" , delivered_date="${today}"  WHERE order_id ='${order_id}'  `
    else if (status == 'cancelled')
      var sql = `UPDATE order_table SET order_status="cancelled" , cancelled_date="${today}"  WHERE order_id ='${order_id}'  `
    else if (status == 'returned')
      var sql = `UPDATE order_table SET order_status="returned" , rejected_date="${today}"  WHERE order_id ='${order_id}'  `
    else if (status == 'rejected')
      var sql = `UPDATE order_table SET order_status="rejected" , returned_date="${today}"  WHERE order_id ='${order_id}'  `

    var data = await exe(sql)
    // res.send(sql);
    res.redirect('/admin/view_orders/' + status)
  }
)

//   ----------------------------------        MANAGE  user --------------------------------
route.get('/users', verify_admin, async function (req, res) {
  var users = await exe(`SELECT * FROM user`)
  // res.send(users);
  var obj = { users: users }
  res.render('admin/view_users.ejs', obj)
})

module.exports = route

// var orders =await exe(`SELECT * FROM order_table , order_details WHERE order_table.order_id = order_details.order_id AND order_table.order_status='${status}'`);

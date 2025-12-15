let mysql = require('mysql2')
let util = require('util')

let conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
})

let exe = util.promisify(conn.query).bind(conn)
module.exports = exe

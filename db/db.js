let mysql = require("mysql");

let conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "it_pdd"
});

conn.connect();

module.exports = conn;

import mysql from "mysql2/promise"; 
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.PORT),
  user: "avnadmin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(process.env.DB_SSL_CA || "ca.pem"),
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


pool
  .getConnection()
  .then((connection) => {
    console.log("Connected to Aiven MySQL");
    connection.release();
  })
  .catch((err) => console.error("Connection error:", err));

export default pool;

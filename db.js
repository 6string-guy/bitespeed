import mysql from "mysql2";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.PORT), 
  user: "avnadmin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(process.env.DB_SSL_CA || "ca.pem"),
  },
});

connection.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("Connected to Aiven MySQL!");
});

export default connection;

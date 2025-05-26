import connection from "./db.js";

connection.query("SELECT NOW()", (err, results) => {
  if (err) throw err;
  console.log("Current time:", results[0]);
});
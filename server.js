import connection from "./db.js";
import express from 'express'
const app = express();
// connection.query("SELECT NOW()", (err, results) => {
//   if (err) throw err;
//   console.log("Current time:", results[0]);
// });

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
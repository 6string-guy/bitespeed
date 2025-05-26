import connection from "./db.js";
import express from 'express'
import cors from 'cors'
const app = express();
app.use(bodyParser.json());
app.use(cors());

// connection.query("SELECT NOW()", (err, results) => {
//   if (err) throw err;
//   console.log("Current time:", results[0]);
// });

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.get("/contacts", (req, res) => {
  connection.query("SELECT * FROM contacts", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.post("/identify", (req, res) => {
  const { email, phoneNumber } = req.body;
  connection.query(
    "SELECT * FROM contacts WHERE email = ? OR phoneNumber = ?",
    [email, phoneNumber],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    }
  );
});
  
  
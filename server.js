import  pool  from "./db.js"; 
import express from "express";
import cors from 'cors'
import bodyParser from "body-parser";

const app = express();
app.use(cors());

const PORT = process.env.SERVER_PORT || 3000;

app.listen(PORT, () => {
    console.log( `Server is running on PORT ${PORT}`)
})

app.use(bodyParser.json());


app.post("/identify", async (req, res) => {
  const { email, phoneNumber } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    
    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ error: "At least one of phone number or email is required" });
    }

    // Find existing contacts with locking
    const [existingContacts] = await connection.query(
      `SELECT * FROM contacts 
         WHERE (email = ? OR phoneNumber = ?)
         AND deletedAt IS NULL
         FOR UPDATE`,
      [email, phoneNumber]
    );

    let primaryContact;

    // Case 1: No existing contacts
    if (existingContacts.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO contacts 
           (email, phoneNumber, linkPrecedence)
           VALUES (?, ?, 'primary')`,
        [email, phoneNumber]
      );
      primaryContact = {
        id: result.insertId,
        email,
        phoneNumber,
        linkPrecedence: "primary",
      };
    } else {
      // Existing contacts logic
       primaryContact = existingContacts[0];

      for (let contact of existingContacts) {
        if (
          contact.linkPrecedence === "primary" &&
          new Date(contact.createdAt) < new Date(primaryContact.createdAt)
        ) {
          primaryContact = contact;
        }
      }


      // Update other primaries to secondary
      await Promise.all(
        existingContacts.map(async (contact) => {
          if (
            contact.id !== primaryContact.id &&
            contact.linkPrecedence === "primary"
          ) {
            await connection.query(
              `UPDATE contacts SET 
               linkPrecedence = 'secondary', 
               linkedId = ?
               WHERE id = ?`,
              [primaryContact.id, contact.id]
            );
          }
        })
      );

     
      const hasNewEmail =
        email && !existingContacts.some((c) => c.email === email);
      const hasNewPhone =
        phoneNumber &&
        !existingContacts.some((c) => c.phoneNumber === phoneNumber);

      if (hasNewEmail || hasNewPhone) {
        await connection.query(
          `INSERT INTO contacts 
             (email, phoneNumber, linkPrecedence, linkedId)
             VALUES (?, ?, 'secondary', ?)`,
          [email, phoneNumber, primaryContact.id]
        );
      }
    }

    // Get final linked contacts
    const [linkedContacts] = await connection.query(
      `SELECT * FROM contacts 
         WHERE (id = ? OR linkedId = ?)
         AND deletedAt IS NULL`,
      [primaryContact.id, primaryContact.id]
    );

    await connection.commit();

    // Prepare response
    const emails = Array.from(
      new Set(
        linkedContacts
          .map((c) => c.email)
          .filter(Boolean)
          .sort((a, b) =>
            a === primaryContact.email ? -1 : b === primaryContact.email ? 1 : 0
          )
      )
    );

    const phoneNumbers = Array.from(
      new Set(
        linkedContacts
          .map((c) => c.phoneNumber)
          .filter(Boolean)
          .sort((a, b) =>
            a === primaryContact.phoneNumber ? -1 : b === primaryContact.phoneNumber ? 1: 0
          )
      )
    );

    const secondaryContactIds = linkedContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => c.id);

    res.json({
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    connection.release();
  }
});
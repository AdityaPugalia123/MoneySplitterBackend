const express = require("express");
const cors = require("cors");
const { connectToDb, getDb } = require("./db");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
const app = express();
const port = process.env.PORT || 9000;
const PASSWORD = process.env.PASSWORD;
require("dotenv").config();
let db;
app.use(express.json());
app.use(cors());

connectToDb((err) => {
  if (!err) {
    app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });
    db = getDb();
  } else {
    console.log(err);
  }
});
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "splittermoney71@gmail.com",
    pass: `${PASSWORD}`,
  },
});

app.post("/users", (req, res) => {
  const user = req.body;
  db.collection("users")
    .insertOne({
      username: user.username.trim(),
      password: user.password,
      encryptedName: user.encryptedName,
      secretKey: user.secretKey,
      email: user.email,
    })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ error: "failed to insertData" });
    });
});
app.get("/users", (req, res) => {
  let users = [];
  db.collection("users")
    .find()
    .forEach((user) => users.push(user))
    .then(() => {
      res.status(200).json(users);
    })
    .catch(() => {
      res.status(500).json({ error: "failed to fetch users collection" });
    });
});
app.post("/event/:user", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .insertOne(req.body)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ error: "failed to post data" });
    });
});
app.get("/event/:user", (req, res) => {
  const events = [];
  db.collection(`${req.params.user}_events`)
    .find()
    .sort({ date: -1 })
    .forEach((event) => {
      events.push(event);
    })
    .then(() => {
      res.status(200).json(events);
    })
    .catch(() => {
      res.status(500).json({ error: "failed to fetch events" });
    });
});
app.get("/events/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .findOne({ _id: new ObjectId(req.params.id) })
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch(() => {
      res.status(500).json({ error: "failed to fetch" });
    });
});
app.post("/expense/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      { $push: { expenses: req.body } }
    )
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "failed to post expense" });
    });
});
app.post("/given/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      { $push: { moneyGiven: req.body } }
    )
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "failed to post expense" });
    });
});
app.get("/event/expenses/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .findOne({ _id: new ObjectId(req.params.id) })
    .then((result) => {
      if (result.moneyGiven.length > 0) {
        result.moneyGiven.map((value) => {
          result.expenses.push(value);
        });
      }
      res.status(200).json(result.expenses);
    })
    .catch(() => {
      res.status(500).json({ err: "failed to fetch" });
    });
});
app.patch("/event/expense/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { expenses: req.body } }
    )
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "failed to delete expenses" });
    });
});
app.patch("/event/money-given/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $pull: { moneyGiven: req.body } }
    )
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "failed to delete expenses" });
    });
});
app.delete("/delete/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .deleteOne({ _id: new ObjectId(req.params.id) })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "failed to fetch" });
    });
});
app.get("/find-user/:user", (req, res) => {
  let temp = req.params.user;
  // console.log(temp);
  while (temp.includes("splitmoney")) {
    let index = temp.indexOf("splitmoney");
    temp = temp.slice(0, index) + "#" + temp.slice(index + 10);
  }
  // console.log(temp);
  db.collection("users")
    .findOne({ encryptedName: temp })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "unable to fetch" });
    });
});
app.post("/mail", (req, res) => {
  let mailOption = {
    from: '"Money Splitter" <splittermoney71@gmail.com>', // sender address
    to: req.body.email,
    subject: req.body.subject,
    text: req.body.text,
    html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Money Splitter</a>
      </div>
      <p style="font-size:1.1em">Hi,</p>
      <p>Thank you for choosing Money Splitter. Use the following OTP to verify it's you. OTP is valid for 5 minutes</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${req.body.otp}</h2>
      <p style="font-size:0.9em;">Regards,<br />Your Brand</p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>Money Splitter Inc</p>
      </div>
    </div>
  </div>`,
  };
  transporter.sendMail(mailOption, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: "failed to send OTP" });
    } else {
      console.log(info.messageId);
      res.status(200).json({ message: "OTP sent successfully" });
    }
  });
});
app.get("/username/:info", (req, res) => {
  let users = [];
  db.collection("users")
    .find(
      { $or: [{ username: req.params.info }, { email: req.params.info }] },
      { username: 1, email: 1 }
    )
    .forEach((user) => {
      let temp = { username: user.username, email: user.email };
      users.push(temp);
    })
    .then(() => {
      res.status(200).json(users);
    })
    .catch(() => {
      res.status(500).json({ error: "failed!" });
    });
});
app.patch("/newPassword/:info", (req, res) => {
  db.collection("users")
    .updateOne(
      { email: req.params.info },
      { $set: { password: req.body.password } }
    )
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ error: "Failed to updata data" });
    });
});
app.patch("/edit/:user/:id", (req, res) => {
  db.collection(`${req.params.user}_events`)
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          eventName: req.body.eventName,
          currency: req.body.currency,
          people: req.body.people,
          admin: req.body.admin,
        },
      }
    )
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({ error: "Failed to updata data" });
    });
});

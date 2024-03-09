const express = require("express");
const router = express.Router();
const pool = require("../queries");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

pool.connect((err, res) => {
  console.info(err), console.info(res);
});

const createToken = (email, role) => {
  return jwt.sign({ email, role }, "rahasiasekali", { expiresIn: "1h" });
};

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No Token Provided." });
  }

  try {
    const decoded = jwt.verify(token, "rahasiasekali");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid Token." });
  }
};

router.post("/register", async (req, res) => {
  const { email, gender, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, gender, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, gender, hashedPassword, role]
    );

    const token = createToken(email, role);

    res.json({
      message: "New User Created",
      location: "/users/" + result.rows[0].id,
      token,
    });
  } catch (error) {
    console.error("Error Inserting User: ", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = createToken(user.email, user.role);

    res.json({ user, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

router.get("/get/page=:page/limit=:limit", authMiddleware, async (req, res) => {
  const page = parseInt(req.params.page);
  const limit = parseInt(req.params.limit);

  if (isNaN(page) || isNaN(limit)) {
    return res.status(400).json({ message: "Invalid page or limit" });
  }

  try {
    const result = await pool.query(`SELECT COUNT(*) FROM users`);

    const totalUsers = result.rows[0].count;

    const offset = (page - 1) * limit;

    const users = await pool.query(
      `SELECT * FROM users ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`
    );

    res.json({
      message: "Users Fetched",
      users: users.rows,
      totalUsers,
    });
  } catch (error) {
    console.error("Error Fetching Users: ", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.put("/put/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { email, gender, password, role } = req.body;

  pool.query(
    `UPDATE users SET email = $1, gender = $2, password = $3, role =$4 WHERE id = $5`,
    [email, gender, password, role, id],
    (error, results) => {
      if (error) {
        console.error("Error updating movie: ", error);
        res
          .status(500)
          .json({ message: "Internal Server Error", error: error.message });
      } else {
        res.json({
          message: "Movie id " + req.params.id + " updated.",
          location: "/users/" + req.params.id,
        });
      }
    }
  );
});

router.delete("/delete/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(`DELETE FROM users where id = $1`, [id], (error, results) => {
    if (error) {
      console.error("Not Found", error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    } else {
      res.send({
        message: "Movie id " + req.params.id + " Removed.",
      });
    }
  });
});

module.exports = router;

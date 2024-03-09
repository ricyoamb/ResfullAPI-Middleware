const express = require("express");
const router = express.Router();
const pool = require("../queries");

pool.connect((err, res) => {
  console.info(err), console.info(res);
});

router.get("/get/page=:page/limit=:limit", async (req, res) => {
  const page = parseInt(req.params.page);
  const limit = parseInt(req.params.limit);

  try {
    const result = await pool.query(`SELECT COUNT(*) FROM movies`);

    const totalMovies = result.rows[0].count;

    const offset = (page - 1) * limit;

    const movies = await pool.query(
      `SELECT * FROM movies ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`
    );

    res.status(200).json({
      message: "Movies fetched",
      movies: movies.rows,
      totalMovies,
    });
  } catch (error) {
    console.error("Error fetching movies: ", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.post("/post", (req, res) => {
  const { title, genres, year } = req.body;

  pool.query(
    `INSERT INTO movies (title, genres, year) VALUES ($1, $2, $3) RETURNING *`,
    [title, genres, year],
    (error, results) => {
      if (error) {
        res
          .status(404)
          .json({ message: "Error updating movie.", error: error.message });
      } else {
        res.status(200).json({
          message: "New movie created",
          location: "/movies/" + results.rows[0].id,
        });
      }
    }
  );
});

router.put("/put/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, genres, year } = req.body;

  pool.query(
    `UPDATE movies SET title = $1, genres = $2, year = $3 WHERE id = $4`,
    [title, genres, year, id],
    (error, results) => {
      if (error) {
        res
          .status(404)
          .json({ message: "Error updating movie.", error: error.message });
      } else {
        res.status(200).json({
          message: "Movie id " + req.params.id + " updated.",
          location: "/movies/" + req.params.id,
        });
      }
    }
  );
});

router.delete("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(`DELETE FROM movies where id = $1`, [id], (error, results) => {
    if (error) {
      console.error("Not Found", error);
      res
        .status(404)
        .json({ message: "Movie Not Found", error: error.message });
    } else {
      res.status(204).send({
        message: "Movie id " + req.params.id + " Removed.",
      });
    }
  });
});

module.exports = router;

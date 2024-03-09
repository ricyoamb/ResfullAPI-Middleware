const express = require("express");
const bodyParser = require("body-parser");
const movies = require("./routes/movies");
const users = require("./routes/users");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const YAML = require("yaml");
const PORT = 3000;
const morgan = require("morgan");

const app = express();

const file = fs.readFileSync("./docs/week9.yaml", "utf-8");
const swaggerDocument = YAML.parse(file);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("tiny"));

app.use("/movies", movies);
app.use("/users", users);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.info(`Server listening on port: ${PORT} `);
});

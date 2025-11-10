const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3069;
const route = require("./src/routes/index.js");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api", route);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Stockfish server running on Port:${PORT}`);
});

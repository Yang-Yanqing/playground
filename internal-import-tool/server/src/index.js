// Why this file exists:
// App entry wires middleware + routes + health endpoint for ops friendliness.

require("dotenv").config();
const express = require("express");
const importsRouter = require("./routes.imports");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/imports", importsRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Internal Import Tool API listening on http://localhost:${port}`);
});

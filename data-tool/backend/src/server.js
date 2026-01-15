import "dotenv/config";
import express from "express";
import cors from "cors";

import sourcesRouter from "./routes/sources.js";
import importsRouter from "./routes/imports.js";
import recordsRouter from "./routes/records.js";

const app = express();

// Why this exists:
// Internal tools still benefit from predictable JSON parsing + CORS for local UI.
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/sources", sourcesRouter);
app.use("/imports", importsRouter);
app.use("/records", recordsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

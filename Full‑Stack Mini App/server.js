// server.js
const db = new Database(path.join(__dirname, "data.db"));


db.pragma("journal_mode = WAL"); // safer writes for local dev


db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
status TEXT NOT NULL CHECK(status IN ('PENDING','RUNNING','DONE','FAILED')) DEFAULT 'PENDING',
created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
`);


// --- Small helpers (NICE)
const ok = (data) => ({ ok: true, data });
const err = (message, code = "BAD_REQUEST") => ({ ok: false, error: { code, message } });


// --- API routes (MUST)
// List tasks
app.get("/api/tasks", (req, res) => {
try {
const { status } = req.query; // optional filter (NICE)
let rows;
if (status) {
rows = db.prepare("SELECT * FROM tasks WHERE status = ? ORDER BY id DESC").all(status);
} else {
rows = db.prepare("SELECT * FROM tasks ORDER BY id DESC").all();
}
res.json(ok(rows));
} catch (e) {
res.status(500).json(err("Failed to list tasks", "LIST_FAILED"));
}
});


// Create task
app.post("/api/tasks", (req, res) => {
try {
const { name } = req.body || {};
if (!name || typeof name !== "string" || !name.trim()) {
return res.status(400).json(err("'name' is required and must be a non-empty string"));
}
const info = db.prepare("INSERT INTO tasks(name, status) VALUES(?, 'PENDING')").run(name.trim());
const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
res.status(201).json(ok(task));
} catch (e) {
res.status(500).json(err("Failed to create task", "CREATE_FAILED"));
}
});


// Update task status
app.patch("/api/tasks/:id", (req, res) => {
try {
const id = Number(req.params.id);
const { status } = req.body || {};


const allowed = new Set(["PENDING", "RUNNING", "DONE", "FAILED"]);
if (!allowed.has(status)) {
return res.status(400).json(err("Invalid status. Use PENDING|RUNNING|DONE|FAILED", "INVALID_STATUS"));
}


const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
if (!existing) return res.status(404).json(err("Task not found", "NOT_FOUND"));


db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
res.json(ok(updated));
} catch (e) {
res.status(500).json(err("Failed to update task", "UPDATE_FAILED"));
}
});


// --- Static hosting of minimal UI (MUST)
app.use(express.static(path.join(__dirname, "public")));


// Root -> serve the demo page
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "public", "index.html"));
});


// --- Boot
app.listen(PORT, () => {
console.log(`Mini app running on http://localhost:${PORT}`);
});
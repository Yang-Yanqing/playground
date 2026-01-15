import React, { useEffect, useState } from "react";

export default function App() {
  const [source, setSource] = useState("demo");
  const [file, setFile] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [items, setItems] = useState([]);
  const [page] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadItems() {
    setErr("");
    const qs = new URLSearchParams({ page: String(page), limit: "20", source });
    const r = await fetch(`/api/items?${qs.toString()}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || "Failed to load items");
    setItems(data.items || []);
  }

  useEffect(() => {
    loadItems().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  async function onUpload() {
    if (!file) return setErr("Please select a file (.csv or .json)");
    setLoading(true);
    setErr("");

    try {
      const form = new FormData();
      form.append("source", source);
      form.append("file", file);

      const r = await fetch("/api/ingest", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "Ingest failed");

      setLastRun(data);
      await loadItems();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Data Ingestion Demo</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label>
          Source:{" "}
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ padding: 6 }}
          />
        </label>

        <input
          type="file"
          accept=".csv,.json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button onClick={onUpload} disabled={loading} style={{ padding: "6px 12px" }}>
          {loading ? "Uploading..." : "Ingest"}
        </button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {lastRun && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd" }}>
          <strong>Last ingest:</strong>
          <pre style={{ margin: 0 }}>{JSON.stringify(lastRun, null, 2)}</pre>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Items</h3>
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th align="left">source</th>
            <th align="left">external_id</th>
            <th align="left">name</th>
            <th align="left">price</th>
            <th align="left">updated_at</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{it.source}</td>
              <td>{it.external_id}</td>
              <td>{it.name}</td>
              <td>
                {it.price_cents == null ? "-" : (it.price_cents / 100).toFixed(2)}{" "}
                {it.currency}
              </td>
              <td>{new Date(it.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12, color: "#666" }}>
        Tip: Import the same file twice. You should see <code>updated_rows</code> increase
        instead of duplicating rows.
      </p>
    </div>
  );
}

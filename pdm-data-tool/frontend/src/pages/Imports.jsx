import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api.js";

export default function Imports() {
  const [sources, setSources] = useState([]);
  const [imports, setImports] = useState([]);

  const [sourceName, setSourceName] = useState("demo-source");
  const [sourceId, setSourceId] = useState(null);

  const [jsonText, setJsonText] = useState(
`[
  {"externalId":"a-1","raw":{"name":"Alice"}},
  {"externalId":"a-2","raw":{"name":""}},
  {"externalId":"a-1","raw":{"name":"Duplicate Alice"}}
]`
  );

  async function refresh() {
    const s = await apiGet("/sources");
    setSources(s);
    if (s.length > 0 && sourceId == null) setSourceId(s[0].id);

    const im = await apiGet("/imports");
    setImports(im);
  }

  useEffect(() => {
    refresh().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSource() {
    const created = await apiPost("/sources", { name: sourceName });
    setSourceId(created.id);
    await refresh();
  }

  async function createImport() {
    const parsed = JSON.parse(jsonText);

    const payload = {
      sourceId: Number(sourceId),
      records: parsed
    };

    const result = await apiPost("/imports", payload);
    window.location.hash = `import/${result.importRunId}`;
    window.location.reload();
  }

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h2>Internal Data Tool</h2>

      <section style={{ marginBottom: 24 }}>
        <h3>1) Source</h3>
        <div>
          <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
          <button onClick={createSource} style={{ marginLeft: 8 }}>Create/Upsert Source</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <select value={sourceId ?? ""} onChange={(e) => setSourceId(Number(e.target.value))}>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>2) Create Import Run</h3>
        <p style={{ maxWidth: 800 }}>
          Paste JSON array of records. Duplicates (same externalId within the same source)
          will be ignored due to DB uniqueness constraint.
        </p>
        <textarea
          rows={10}
          style={{ width: "100%", maxWidth: 900 }}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div style={{ marginTop: 8 }}>
          <button disabled={!sourceId} onClick={createImport}>Run Import</button>
        </div>
      </section>

      <section>
        <h3>3) Recent Import Runs</h3>
        <ul>
          {imports.map((r) => (
            <li key={r.id}>
              <a href={`#import/${r.id}`}>Run #{r.id}</a> — source: {r.source_name} — status: {r.status}
              {" "} (inserted {r.inserted_count}, dup {r.duplicate_count}, failed {r.failed_count})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

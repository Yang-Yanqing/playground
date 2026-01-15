import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api.js";

export default function ImportDetail({ id }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const d = await apiGet(`/imports/${id}`);
      setData(d);
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function retry(recordId) {
    await apiPost(`/records/${recordId}/retry`, {});
    await load();
  }

  if (err) return <div style={{ padding: 16 }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading...</div>;

  const { run, records } = data;

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <a href="#">← Back</a>
      <h2>Import Run #{run.id}</h2>
      <p>
        Source: {run.source_name} | Status: {run.status} <br />
        Total: {run.total_count} | Inserted: {run.inserted_count} | Duplicates: {run.duplicate_count} | Failed: {run.failed_count}
      </p>

      <h3>Records (max 200)</h3>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>externalId</th>
            <th>status</th>
            <th>retry</th>
            <th>error</th>
            <th>action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.external_id}</td>
              <td>{r.status}</td>
              <td>{r.retry_count}</td>
              <td style={{ maxWidth: 300 }}>{r.error_message}</td>
              <td>
                {r.status === "FAILED" ? (
                  <button onClick={() => retry(r.id)}>Retry</button>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function parseJson(buffer) {
  const text = buffer.toString("utf-8");
  const data = JSON.parse(text);

  // Support either an array or { items: [...] }
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;

  throw new Error("Invalid JSON format: expected array or { items: [] }");
}

// Why it exists：第三方导出经常就是 JSON array；同样隔离格式解析。
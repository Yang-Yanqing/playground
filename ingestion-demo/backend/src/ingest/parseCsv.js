import { parse } from "csv-parse/sync";

export function parseCsv(buffer) {
  // We accept header row and return an array of objects.
  const text = buffer.toString("utf-8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

// Why it exists：把“输入格式变化”隔离在 parser；你后面要支持新 CSV 列名，只改这里。
// Basic normalization for ingestion.
// Keep it small and predictable: interviews love deterministic logic.

export function cleanRow(input) {
  // input can be from CSV or JSON
  const source = String(input.source || "").trim();
  const externalId = String(input.external_id || input.id || "").trim();
  const name = String(input.name || input.title || "").trim();

  // Price can be "12.34", 12.34, "€12,34" (we keep it simple)
  const priceRaw = input.price ?? input.price_eur ?? null;
  const priceCents = toCents(priceRaw);

  const currency = (input.currency || "EUR").toString().trim().toUpperCase();

  // Minimal required fields
  if (!source || !externalId || !name) {
    return { ok: false, reason: "missing_required_fields" };
  }

  return {
    ok: true,
    value: {
      source,
      external_id: externalId,
      name,
      price_cents: priceCents,
      currency,
      raw: input
    }
  };
}

function toCents(v) {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).replace("€", "").replace(",", ".").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  // Convert to integer cents
  return Math.round(n * 100);
}


// Why it exists：把“脏数据治理”变成一个可解释的、可测试的小函数。
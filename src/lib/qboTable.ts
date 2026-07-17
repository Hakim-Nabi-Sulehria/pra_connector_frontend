/** Flatten a QBO invoice/object into dot-path keys for table columns. */
export function flattenQboRecord(
  value: unknown,
  prefix = '',
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  if (value === null || value === undefined) {
    if (prefix) out[prefix] = value;
    return out;
  }

  if (Array.isArray(value)) {
    const base = prefix || 'item';
    if (base === 'CustomField' || base.endsWith('.CustomField')) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'Name' in item) {
          const cf = item as Record<string, unknown>;
          const name = String(cf.Name ?? 'unnamed');
          const cfKey = `${base}.${name}`;
          out[cfKey] =
            cf.StringValue ??
            cf.BooleanValue ??
            cf.DateValue ??
            cf.NumberValue ??
            null;
          out[`${cfKey}.DefinitionId`] = cf.DefinitionId ?? null;
          out[`${cfKey}.Type`] = cf.Type ?? null;
        }
      }
    }
    value.forEach((item, index) => {
      flattenQboRecord(item, `${base}.${index}`, out);
    });
    return out;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${key}` : key;
      if (child !== null && typeof child === 'object') {
        flattenQboRecord(child, next, out);
      } else {
        out[next] = child;
      }
    }
    return out;
  }

  if (prefix) out[prefix] = value;
  return out;
}

export function collectQboColumns(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) keys.add(key);
  }

  const priority = [
    'Id',
    'DocNumber',
    'TxnDate',
    'CustomerRef.name',
    'CustomerRef.value',
    'TotalAmt',
    'Balance',
    'DueDate',
    'EmailStatus',
    'PrintStatus',
  ];

  const custom = Array.from(keys)
    .filter((k) => /customfield/i.test(k))
    .sort();
  const hs = custom.filter((k) => /hs\s*code/i.test(k));
  const rest = Array.from(keys)
    .filter((k) => !priority.includes(k) && !custom.includes(k))
    .sort();

  return [
    ...priority.filter((k) => keys.has(k)),
    ...hs,
    ...custom.filter((k) => !hs.includes(k)),
    ...rest,
  ];
}

export function formatQboCell(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value === '') return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function findHsCodeKeys(columns: string[]): string[] {
  return columns.filter((c) => /hs\s*code/i.test(c));
}

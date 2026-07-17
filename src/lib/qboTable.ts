/** Extract the display value from a QBO CustomField object. */
function customFieldValue(cf: Record<string, unknown>): unknown {
  if ('StringValue' in cf) return cf.StringValue ?? null;
  if ('BooleanValue' in cf) return cf.BooleanValue ?? null;
  if ('DateValue' in cf) return cf.DateValue ?? null;
  if ('NumberValue' in cf) return cf.NumberValue ?? null;
  return null;
}

function isCustomFieldArray(path: string): boolean {
  return path === 'CustomField' || path.endsWith('.CustomField');
}

/**
 * Flatten a QBO invoice into dot-path keys.
 * CustomField arrays become named columns: CustomField.<Name>
 * (works for any custom fields — HS code, PCT, etc.)
 */
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

    if (isCustomFieldArray(base)) {
      for (const item of value) {
        if (!item || typeof item !== 'object') continue;
        const cf = item as Record<string, unknown>;
        const name = String(cf.Name ?? cf.DefinitionId ?? 'unnamed').trim() || 'unnamed';
        const cfKey = `${base}.${name}`;
        // Always set the value key so the column exists even when null/empty.
        out[cfKey] = customFieldValue(cf);
        if (cf.DefinitionId != null) out[`${cfKey}.DefinitionId`] = cf.DefinitionId;
        if (cf.Type != null) out[`${cfKey}.Type`] = cf.Type;
      }
      // Do not also expand CustomField.0 / CustomField.1 — named columns are enough.
      return out;
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

export function isCustomFieldColumn(key: string): boolean {
  return /(^|\.)CustomField\./i.test(key);
}

/** Value columns only (exclude DefinitionId / Type metadata). */
export function isCustomFieldValueColumn(key: string): boolean {
  return isCustomFieldColumn(key) && !/\.(DefinitionId|Type)$/i.test(key);
}

export function customFieldLabel(key: string): string {
  const match = key.match(/CustomField\.(.+?)(?:\.(DefinitionId|Type))?$/i);
  if (!match) return key;
  if (match[2]) return `${match[1]} (${match[2]})`;
  return match[1];
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

  const customValueCols = Array.from(keys)
    .filter(isCustomFieldValueColumn)
    .sort((a, b) => customFieldLabel(a).localeCompare(customFieldLabel(b)));

  const customMetaCols = Array.from(keys)
    .filter((k) => isCustomFieldColumn(k) && !isCustomFieldValueColumn(k))
    .sort();

  const rest = Array.from(keys)
    .filter(
      (k) =>
        !priority.includes(k) &&
        !isCustomFieldColumn(k),
    )
    .sort();

  return [
    ...priority.filter((k) => keys.has(k)),
    ...customValueCols,
    ...rest,
    ...customMetaCols,
  ];
}

export function collectCustomFieldNames(columns: string[]): string[] {
  return columns.filter(isCustomFieldValueColumn).map(customFieldLabel);
}

export function formatQboCell(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value === '') return '(empty)';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

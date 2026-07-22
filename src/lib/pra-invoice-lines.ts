export type PraLineRow = {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  pctCode: string | null;
  taxRate: number;
  saleValue: number;
  taxCharged: number;
  discount: number;
  furtherTax: number;
  totalAmount: number;
  invoiceType: number;
  refUsin: string | null;
};

export type PraLineTotals = {
  qty: number;
  saleValue: number;
  taxCharged: number;
  discount: number;
  furtherTax: number;
  totalAmount: number;
};

function lineCustomField(line: any, name: string) {
  const match = (line?.CustomField || []).find(
    (field: any) => String(field?.Name || '').toLowerCase() === name.toLowerCase(),
  );
  const value =
    match?.StringValue ??
    match?.NumberValue ??
    match?.DateValue ??
    match?.BooleanValue;
  if (value === null || value === undefined || value === '') return null;
  return value;
}

export function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function fmtQty(value: unknown) {
  const n = num(value, 0);
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtPct(value: unknown) {
  return `${fmtQty(value)}%`;
}

/** Unique address lines; optionally skip values already shown (e.g. customer name). */
export function addressLines(address: any, exclude: Array<unknown> = []) {
  if (!address) return [];
  const excluded = new Set(
    exclude
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean),
  );
  const raw = [
    address.Line1,
    address.Line2,
    address.Line3,
    [address.City, address.CountrySubDivisionCode, address.PostalCode]
      .filter(Boolean)
      .join(', '),
    address.Country,
  ];
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const entry of raw) {
    const line = String(entry || '').trim();
    if (!line) continue;
    const key = line.toLowerCase();
    if (excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
  }
  return lines;
}

export function salesLines(invoice: any) {
  return (invoice?.Line || []).filter(
    (line: any) => line?.DetailType === 'SalesItemLineDetail',
  );
}

export function buildPraLines(invoice: any): PraLineRow[] {
  const taxRate = num(
    invoice?.TxnTaxDetail?.TaxLine?.[0]?.TaxLineDetail?.TaxPercent,
    0,
  );
  return salesLines(invoice).map((line: any, index: number) => {
    const detail = line.SalesItemLineDetail || {};
    const saleValue = num(line.Amount, 0);
    const taxCharged = Math.round(saleValue * (taxRate / 100) * 100) / 100;
    const discount = 0;
    const furtherTax = 0;
    const pct =
      lineCustomField(line, 'PCTCode') ??
      lineCustomField(line, 'PCT Code') ??
      lineCustomField(line, 'HS Code');
    const itemName =
      detail.ItemRef?.name || line.Description || '—';
    return {
      id: String(line.Id || index),
      itemCode: detail.ItemRef?.value != null ? String(detail.ItemRef.value) : '',
      itemName: String(itemName),
      qty: num(detail.Qty, 0),
      pctCode: pct == null || pct === '' ? null : String(pct),
      taxRate,
      saleValue,
      taxCharged,
      discount,
      furtherTax,
      totalAmount:
        Math.round((saleValue + taxCharged + furtherTax - discount) * 100) / 100,
      invoiceType: 1,
      refUsin: null,
    };
  });
}

export function sumPraLines(rows: PraLineRow[]): PraLineTotals {
  return rows.reduce(
    (acc, row) => {
      acc.qty += row.qty;
      acc.saleValue += row.saleValue;
      acc.taxCharged += row.taxCharged;
      acc.discount += row.discount;
      acc.furtherTax += row.furtherTax;
      acc.totalAmount += row.totalAmount;
      return acc;
    },
    {
      qty: 0,
      saleValue: 0,
      taxCharged: 0,
      discount: 0,
      furtherTax: 0,
      totalAmount: 0,
    },
  );
}

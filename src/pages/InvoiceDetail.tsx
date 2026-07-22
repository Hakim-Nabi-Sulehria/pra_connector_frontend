import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function date(value: unknown) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB').format(parsed);
}

function customField(invoice: any, name: string) {
  const match = (invoice?.CustomField || []).find(
    (field: any) => String(field?.Name || '').toLowerCase() === name.toLowerCase(),
  );
  const value =
    match?.StringValue ??
    match?.NumberValue ??
    match?.DateValue ??
    match?.BooleanValue;
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

function addressLines(address: any) {
  if (!address) return [];
  return [
    address.Line1,
    address.Line2,
    address.Line3,
    [address.City, address.CountrySubDivisionCode, address.PostalCode]
      .filter(Boolean)
      .join(', '),
    address.Country,
  ]
    .map((line) => String(line || '').trim())
    .filter(Boolean);
}

function salesLines(invoice: any) {
  return (invoice?.Line || []).filter(
    (line: any) => line?.DetailType === 'SalesItemLineDetail',
  );
}

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

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fmtQty(value: unknown) {
  const n = num(value, 0);
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(value: unknown) {
  return `${fmtQty(value)}%`;
}

type PraLineRow = {
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

function buildPraLines(invoice: any): PraLineRow[] {
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
    return {
      id: String(line.Id || index),
      itemCode: text(detail.ItemRef?.value, ''),
      itemName: text(detail.ItemRef?.name, line.Description || ''),
      qty: num(detail.Qty, 0),
      pctCode: pct == null || pct === '' ? null : String(pct),
      taxRate,
      saleValue,
      taxCharged,
      discount,
      furtherTax,
      totalAmount: Math.round((saleValue + taxCharged + furtherTax - discount) * 100) / 100,
      invoiceType: 1,
      refUsin: null,
    };
  });
}

function StatusChip({ status }: { status?: string }) {
  const s = (status || 'PENDING').toUpperCase();
  const cls =
    s === 'POSTED' || s === 'CONNECTED'
      ? 'ok'
      : s === 'FAILED' || s === 'ERROR'
        ? 'danger'
        : s === 'PENDING' || s === 'RETRYING'
          ? 'warn'
          : 'muted';
  return <span className={`badge ${cls}`}>{s}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="invoice-detail-card">
      <div className="invoice-section-header">{title}</div>
      <div className="invoice-section-body">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="invoice-detail-field">
      <label>{label}</label>
      <div className="invoice-detail-value">{value}</div>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [tracked, setTracked] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [qbo, trackedRows] = await Promise.all([
        api('/customer/qbo/invoices?max=100'),
        api('/customer/invoices'),
      ]);
      const found = (qbo?.invoices || []).find(
        (candidate: any) => String(candidate?.Id) === String(id),
      );
      if (!found) throw new Error('Invoice was not found in QuickBooks.');
      const track = (trackedRows || []).find(
        (row: any) => String(row?.qboInvoiceId) === String(id),
      );
      setInvoice(found);
      setTracked(track || null);
    } catch (e: any) {
      setError(e.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function postToPra() {
    if (!invoice?.Id) return;
    setPosting(true);
    setError('');
    setMsg('');
    try {
      const result = await api('/customer/invoices/attach-fiscal', {
        method: 'POST',
        body: JSON.stringify({
          qboInvoiceId: String(invoice.Id),
          usin: invoice.DocNumber || String(invoice.Id),
          customerName: invoice.CustomerRef?.name || undefined,
          totalAmount: invoice.TotalAmt != null ? Number(invoice.TotalAmt) : undefined,
          writeToQbo: true,
        }),
      });
      setMsg(
        result.qboWriteVerified
          ? 'Posted to PRA and fiscal number written back to QBO.'
          : 'Posted to PRA successfully.',
      );
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to post invoice to PRA');
    } finally {
      setPosting(false);
    }
  }

  const praLines = useMemo(() => buildPraLines(invoice), [invoice]);
  const lineTotals = useMemo(() => {
    return praLines.reduce(
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
  }, [praLines]);
  const billAddress = addressLines(invoice?.BillAddr);
  const shipAddress = addressLines(invoice?.ShipAddr);
  const fiscalNo =
    tracked?.fiscalInvoiceNo ||
    customField(invoice, 'Fiscal Invoice') ||
    customField(invoice, 'Fiscal Invoice No');
  const hsCode = customField(invoice, 'HS Code');
  const praStatus = tracked?.status || 'PENDING';

  if (loading) return <PageLoader label="Loading invoice details…" />;
  if (error && !invoice) return <div className="error-box">{error}</div>;
  if (!invoice) return null;

  return (
    <div className="invoice-detail-page">
      <div className="topbar">
        <div className="invoice-detail-title-wrap">
          <Link className="btn btn-ghost" to="/app/invoices">
            Back
          </Link>
          <div>
            <h1>Invoice {text(invoice.DocNumber, String(invoice.Id))}</h1>
            <p>
              QuickBooks invoice detail · <StatusChip status={praStatus} />
            </p>
          </div>
        </div>
        <div className="invoice-toolbar-actions">
          <button
            className="btn btn-ghost"
            onClick={() =>
              navigate(`/app/invoices/${encodeURIComponent(String(invoice.Id))}/print`)
            }
          >
            View Invoice
          </button>
          <button
            className="btn btn-primary"
            disabled={posting}
            onClick={postToPra}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: 14, color: 'var(--ok)' }}>
          {msg}
        </div>
      )}

      <div className="invoice-detail-grid">
        <Section title="Header">
          <div className="invoice-detail-fields">
            <Field label="Invoice no" value={text(invoice.DocNumber)} />
            <Field label="Invoice date" value={date(invoice.TxnDate)} />
            <Field label="Due date" value={date(invoice.DueDate)} />
            <Field label="Terms" value={text(invoice.SalesTermRef?.name)} />
            <Field label="Email status" value={text(invoice.EmailStatus)} />
            <Field label="Print status" value={text(invoice.PrintStatus)} />
            <Field label="HS Code" value={text(hsCode)} />
            <Field label="Fiscal Invoice" value={text(fiscalNo)} />
            <Field label="PRA status" value={<StatusChip status={praStatus} />} />
          </div>
        </Section>

        <Section title="Customer">
          <div className="invoice-detail-fields">
            <Field label="Customer name" value={text(invoice.CustomerRef?.name)} />
            <Field label="Customer ID" value={text(invoice.CustomerRef?.value)} />
            <Field
              label="Bill to"
              value={
                billAddress.length ? (
                  <div className="address-stack">
                    {billAddress.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
            <Field
              label="Ship to"
              value={
                shipAddress.length ? (
                  <div className="address-stack">
                    {shipAddress.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
          </div>
        </Section>

        <Section title="Line items">
          <div className="di-invoice-scroll invoice-lines-scroll">
            <table className="di-invoice-table invoice-pra-lines-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item no</th>
                  <th>Item name</th>
                  <th className="num">Qty</th>
                  <th>PCT</th>
                  <th className="num">Sales tax %</th>
                  <th className="num">Sale val</th>
                  <th className="num">Total amt</th>
                  <th className="num">Sales tax</th>
                  <th className="num">Disc.</th>
                  <th className="num">Further tax</th>
                  <th className="num">Inv type</th>
                  <th>Ref USIN</th>
                </tr>
              </thead>
              <tbody>
                {praLines.map((row, index) => (
                  <tr key={row.id} className="di-invoice-row">
                    <td>{index + 1}</td>
                    <td className="mono">{text(row.itemCode, '—')}</td>
                    <td>{text(row.itemName)}</td>
                    <td className="num">{fmtQty(row.qty)}</td>
                    <td className="mono">{row.pctCode ?? 'null'}</td>
                    <td className="num">{fmtPct(row.taxRate)}</td>
                    <td className="num">{money(row.saleValue)}</td>
                    <td className="num">{money(row.totalAmount)}</td>
                    <td className="num">{money(row.taxCharged)}</td>
                    <td className="num">{money(row.discount)}</td>
                    <td className="num">{money(row.furtherTax)}</td>
                    <td className="num">{row.invoiceType}</td>
                    <td className="mono">{row.refUsin ?? 'null'}</td>
                  </tr>
                ))}
                {!praLines.length && (
                  <tr>
                    <td colSpan={13} className="empty-cell">
                      No sales lines on this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Totals">
          <div className="invoice-detail-fields totals-grid">
            <Field label="Total qty" value={fmtQty(lineTotals.qty)} />
            <Field label="Total sale value" value={money(lineTotals.saleValue)} />
            <Field label="Total sales tax" value={money(lineTotals.taxCharged)} />
            <Field label="Total disc." value={money(lineTotals.discount)} />
            <Field label="Total further tax" value={money(lineTotals.furtherTax)} />
            <Field label="Total amt" value={money(lineTotals.totalAmount)} />
            <Field label="Invoice total (QBO)" value={money(invoice.TotalAmt)} />
            <Field label="Balance due" value={money(invoice.Balance)} />
            <Field label="Payment mode" value="1" />
            <Field label="Inv type" value="1" />
            <Field label="Ref USIN" value="null" />
            <Field label="Customer memo" value={text(invoice.CustomerMemo?.value)} />
          </div>
        </Section>
      </div>
    </div>
  );
}

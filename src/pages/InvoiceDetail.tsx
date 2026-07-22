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

  const lines = useMemo(() => salesLines(invoice), [invoice]);
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
          <div className="di-invoice-scroll">
            <table className="di-invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product / service</th>
                  <th>Description</th>
                  <th className="num">Qty</th>
                  <th className="num">Rate</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any, index: number) => {
                  const detail = line.SalesItemLineDetail || {};
                  return (
                    <tr key={line.Id || index} className="di-invoice-row">
                      <td>{index + 1}</td>
                      <td>{text(detail.ItemRef?.name)}</td>
                      <td>{text(line.Description)}</td>
                      <td className="num">{text(detail.Qty, '0')}</td>
                      <td className="num">{money(detail.UnitPrice)}</td>
                      <td className="num">{money(line.Amount)}</td>
                    </tr>
                  );
                })}
                {!lines.length && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
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
            <Field label="Subtotal / Invoice total" value={money(invoice.TotalAmt)} />
            <Field label="Balance due" value={money(invoice.Balance)} />
            <Field
              label="Customer memo"
              value={text(invoice.CustomerMemo?.value)}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

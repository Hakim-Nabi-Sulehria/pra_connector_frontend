import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
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
  return (
    match?.StringValue ??
    match?.NumberValue ??
    match?.DateValue ??
    match?.BooleanValue ??
    ''
  );
}

function addressLines(address: any) {
  if (!address) return [];
  const lines = [
    address.Line1,
    address.Line2,
    address.Line3,
    [address.City, address.CountrySubDivisionCode, address.PostalCode].filter(Boolean).join(', '),
    address.Country,
  ];
  return lines.map((line) => String(line || '').trim()).filter(Boolean);
}

function salesLines(invoice: any) {
  return (invoice?.Line || []).filter(
    (line: any) => line?.DetailType === 'SalesItemLineDetail',
  );
}

export function FiscalInvoiceReportPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [fiscalInvoiceNo, setFiscalInvoiceNo] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [qbo, companyResponse, tracked] = await Promise.all([
        api('/customer/qbo/invoices?max=100'),
        api('/customer/qbo/company'),
        api('/customer/invoices'),
      ]);
      const found = (qbo?.invoices || []).find(
        (candidate: any) => String(candidate?.Id) === String(id),
      );
      if (!found) throw new Error('Invoice was not found in QuickBooks.');

      const trackedRow = (tracked || []).find(
        (row: any) => String(row?.qboInvoiceId) === String(id),
      );
      const fiscal =
        trackedRow?.fiscalInvoiceNo ||
        customField(found, 'Fiscal Invoice') ||
        customField(found, 'Fiscal Invoice No');

      setInvoice(found);
      setCompany(companyResponse?.company || companyResponse || null);
      setFiscalInvoiceNo(String(fiscal || ''));
    } catch (e: any) {
      setError(e.message || 'Failed to load printable invoice.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!fiscalInvoiceNo) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(fiscalInvoiceNo, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#071b2a', light: '#ffffff' },
    })
      .then((value) => {
        if (!cancelled) setQrDataUrl(value);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [fiscalInvoiceNo]);

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
      setFiscalInvoiceNo(String(result.fiscalInvoiceNo || ''));
      setMsg(
        result.qboWriteVerified
          ? 'Posted to PRA and fiscal number written back to QBO.'
          : 'Posted to PRA. Check QBO custom field if write-back needs attention.',
      );
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to post invoice to PRA');
    } finally {
      setPosting(false);
    }
  }

  const lines = useMemo(() => salesLines(invoice), [invoice]);
  const companyAddress = addressLines(company?.CompanyAddr || company?.LegalAddr);
  const billAddress = addressLines(invoice?.BillAddr);
  const shipAddress = addressLines(invoice?.ShipAddr);
  const hsCode = customField(invoice, 'HS Code');

  if (loading) return <PageLoader label="Preparing invoice preview…" />;
  if (error && !invoice) return <div className="error-box">{error}</div>;
  if (!invoice) return null;

  return (
    <div className="fiscal-report-page">
      <div className="report-actions no-print">
        <Link className="btn btn-ghost" to="/app/invoices">
          Back to invoices
        </Link>
        <div className="report-actions-right">
          <button
            className="btn btn-primary"
            disabled={posting}
            onClick={postToPra}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              document.title = `Invoice-${invoice.DocNumber || invoice.Id}`;
              window.print();
            }}
          >
            Print
          </button>
        </div>
      </div>

      {error && <div className="error-box no-print">{error}</div>}
      {msg && (
        <div className="card no-print" style={{ marginBottom: 14, color: 'var(--ok)' }}>
          {msg}
        </div>
      )}

      <article className="fiscal-print-sheet">
        <header className="fiscal-report-header">
          <div>
            <h1>INVOICE</h1>
            <strong>{text(company?.CompanyName, 'Company')}</strong>
            {company?.Email?.Address ? <p>{company.Email.Address}</p> : null}
            {company?.PrimaryPhone?.FreeFormNumber ? (
              <p>{company.PrimaryPhone.FreeFormNumber}</p>
            ) : null}
            {companyAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          {fiscalInvoiceNo ? (
            <div className="fiscal-qr-block">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`Fiscal invoice QR ${fiscalInvoiceNo}`} />
              ) : (
                <div className="fiscal-qr-placeholder">QR</div>
              )}
              <span>Fiscal Invoice QR</span>
            </div>
          ) : null}
        </header>

        <section className="fiscal-address-grid">
          <div>
            <span className="report-label">Bill to</span>
            <strong>{text(invoice?.CustomerRef?.name)}</strong>
            {billAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div>
            <span className="report-label">Ship to</span>
            <strong>{text(invoice?.CustomerRef?.name)}</strong>
            {shipAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="fiscal-meta-grid">
          <div>
            <h2>Invoice details</h2>
            <dl>
              <div>
                <dt>Invoice no.</dt>
                <dd>{text(invoice.DocNumber)}</dd>
              </div>
              <div>
                <dt>Terms</dt>
                <dd>{text(invoice.SalesTermRef?.name)}</dd>
              </div>
              <div>
                <dt>Invoice date</dt>
                <dd>{date(invoice.TxnDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{date(invoice.DueDate)}</dd>
              </div>
            </dl>
          </div>
          <div>
            <dl>
              <div>
                <dt>HS Code</dt>
                <dd>{text(hsCode)}</dd>
              </div>
              <div>
                <dt>Fiscal Invoice</dt>
                <dd>{text(fiscalInvoiceNo)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <table className="fiscal-lines-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product or service</th>
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
                <tr key={line.Id || index}>
                  <td>{index + 1}</td>
                  <td>{text(detail.ItemRef?.name)}</td>
                  <td>{text(line.Description)}</td>
                  <td className="num">{text(detail.Qty, '0')}</td>
                  <td className="num">{money(detail.UnitPrice)}</td>
                  <td className="num">{money(line.Amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <section className="fiscal-report-footer">
          <div>
            {invoice.CustomerMemo?.value ? (
              <>
                <h3>Notes</h3>
                <p>{invoice.CustomerMemo.value}</p>
              </>
            ) : null}
          </div>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{money(invoice.TotalAmt)}</dd>
            </div>
            <div>
              <dt>Invoice total</dt>
              <dd>{money(invoice.TotalAmt)}</dd>
            </div>
            <div>
              <dt>Balance due</dt>
              <dd>{money(invoice.Balance)}</dd>
            </div>
          </dl>
        </section>

        <p className="system-note">
          This document is system-generated and does not require a signature.
        </p>
      </article>
    </div>
  );
}

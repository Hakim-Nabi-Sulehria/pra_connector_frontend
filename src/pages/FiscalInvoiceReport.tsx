import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';
import {
  addressLines,
  buildPraLines,
  fmtPct,
  fmtQty,
  sumPraLines,
} from '../lib/pra-invoice-lines';

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

  const praLines = useMemo(() => buildPraLines(invoice), [invoice]);
  const lineTotals = useMemo(() => sumPraLines(praLines), [praLines]);
  const customerName = invoice?.CustomerRef?.name;
  const companyAddress = addressLines(company?.CompanyAddr || company?.LegalAddr);
  const billAddress = addressLines(invoice?.BillAddr, [customerName]);
  const shipAddress = addressLines(invoice?.ShipAddr, [customerName]);
  const hsCode = customField(invoice, 'HS Code');

  if (loading) return <PageLoader label="Preparing invoice preview…" />;
  if (error && !invoice) return <div className="error-box">{error}</div>;
  if (!invoice) return null;

  return (
    <div className="fiscal-report-page">
      <div className="report-actions no-print">
        <Link className="btn btn-ghost" to={`/app/invoices/${encodeURIComponent(String(id || invoice.Id))}`}>
          Back to invoice
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
            <strong>{text(customerName)}</strong>
            {billAddress.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div>
            <span className="report-label">Ship to</span>
            <strong>{text(customerName)}</strong>
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

        <div className="fiscal-lines-wrap">
          <table className="fiscal-lines-table fiscal-pra-lines">
            <thead>
              <tr>
                <th>#</th>
                <th>Item no</th>
                <th>Item name</th>
                <th className="num">Qty</th>
                <th>PCT</th>
                <th className="num">Tax %</th>
                <th className="num">Sale val</th>
                <th className="num">Total</th>
                <th className="num">Tax</th>
                <th className="num">Disc.</th>
                <th className="num">F.tax</th>
                <th className="num">Type</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {praLines.map((row, index) => (
                <tr key={row.id}>
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
              <dt>Total qty</dt>
              <dd>{fmtQty(lineTotals.qty)}</dd>
            </div>
            <div>
              <dt>Total sale value</dt>
              <dd>{money(lineTotals.saleValue)}</dd>
            </div>
            <div>
              <dt>Total sales tax</dt>
              <dd>{money(lineTotals.taxCharged)}</dd>
            </div>
            <div>
              <dt>Total disc.</dt>
              <dd>{money(lineTotals.discount)}</dd>
            </div>
            <div>
              <dt>Total further tax</dt>
              <dd>{money(lineTotals.furtherTax)}</dd>
            </div>
            <div>
              <dt>Total amt</dt>
              <dd>{money(lineTotals.totalAmount)}</dd>
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

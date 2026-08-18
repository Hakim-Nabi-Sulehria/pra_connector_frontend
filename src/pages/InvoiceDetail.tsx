import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';
import {
  addressLines,
  buildPraLines,
  fmtPct,
  fmtQty,
  sumPraLines,
  type PraLineRow,
} from '../lib/pra-invoice-lines';

type InvoiceDraft = {
  header: {
    docNumber: string;
    txnDate: string;
    dueDate: string;
    terms: string;
    emailStatus: string;
    printStatus: string;
    hsCode: string;
    fiscalInvoice: string;
  };
  customer: {
    name: string;
    id: string;
    billTo: string;
    shipTo: string;
  };
  lines: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    qty: string;
    pctCode: string;
    taxRate: string;
    saleValue: string;
    totalAmount: string;
    taxCharged: string;
    discount: string;
    furtherTax: string;
    invoiceType: string;
    refUsin: string;
  }>;
  totals: {
    totalQty: string;
    totalSaleValue: string;
    totalTax: string;
    totalDisc: string;
    totalFurtherTax: string;
    totalAmount: string;
    paymentMode: string;
    invoiceType: string;
    refUsin: string;
    customerMemo: string;
  };
};

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

function toInputDate(value: unknown) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString().slice(0, 10);
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

function Field({
  label,
  value,
  editing,
  onChange,
  type = 'text',
}: {
  label: string;
  value: React.ReactNode;
  editing?: boolean;
  onChange?: (next: string) => void;
  type?: 'text' | 'date' | 'number';
}) {
  return (
    <div className="invoice-detail-field">
      <label>{label}</label>
      {editing && onChange ? (
        <input
          className="invoice-detail-input"
          type={type}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="invoice-detail-value">{value}</div>
      )}
    </div>
  );
}

function buildDraftFromSources(
  invoice: any,
  praLines: PraLineRow[],
  lineTotals: ReturnType<typeof sumPraLines>,
  fiscalNo: string,
  hsCode: string,
  billAddress: string[],
  shipAddress: string[],
  saved?: Partial<InvoiceDraft> | null,
): InvoiceDraft {
  const base: InvoiceDraft = {
    header: {
      docNumber: text(invoice.DocNumber, ''),
      txnDate: toInputDate(invoice.TxnDate),
      dueDate: toInputDate(invoice.DueDate),
      terms: text(invoice.SalesTermRef?.name, ''),
      emailStatus: text(invoice.EmailStatus, ''),
      printStatus: text(invoice.PrintStatus, ''),
      hsCode,
      fiscalInvoice: fiscalNo,
    },
    customer: {
      name: text(invoice.CustomerRef?.name, ''),
      id: text(invoice.CustomerRef?.value, ''),
      billTo: billAddress.join('\n'),
      shipTo: shipAddress.join('\n'),
    },
    lines: praLines.map((row) => ({
      id: row.id,
      itemCode: row.itemCode,
      itemName: row.itemName,
      qty: String(row.qty),
      pctCode: row.pctCode ?? '',
      taxRate: String(row.taxRate),
      saleValue: String(row.saleValue),
      totalAmount: String(row.totalAmount),
      taxCharged: String(row.taxCharged),
      discount: String(row.discount),
      furtherTax: String(row.furtherTax),
      invoiceType: String(row.invoiceType),
      refUsin: row.refUsin ?? '',
    })),
    totals: {
      totalQty: String(lineTotals.qty),
      totalSaleValue: String(lineTotals.saleValue),
      totalTax: String(lineTotals.taxCharged),
      totalDisc: String(lineTotals.discount),
      totalFurtherTax: String(lineTotals.furtherTax),
      totalAmount: String(lineTotals.totalAmount),
      paymentMode: '1',
      invoiceType: '1',
      refUsin: '',
      customerMemo: text(invoice.CustomerMemo?.value, ''),
    },
  };
  if (!saved) return base;
  return {
    header: { ...base.header, ...(saved.header || {}) },
    customer: { ...base.customer, ...(saved.customer || {}) },
    lines: saved.lines?.length
      ? saved.lines.map((line, index) => ({
          ...base.lines[index],
          ...line,
        }))
      : base.lines,
    totals: { ...base.totals, ...(saved.totals || {}) },
  };
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-card">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={busy} onClick={onConfirm}>
            {busy ? 'Posting…' : confirmLabel}
          </button>
        </div>
      </div>
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
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [confirmPost, setConfirmPost] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [qbo, trackedRow] = await Promise.all([
        api('/customer/qbo/invoices?max=100'),
        id ? api(`/customer/invoices/${encodeURIComponent(id)}`) : Promise.resolve(null),
      ]);
      const found = (qbo?.invoices || []).find(
        (candidate: any) => String(candidate?.Id) === String(id),
      );
      if (!found) throw new Error('Invoice was not found in QuickBooks.');
      setInvoice(found);
      setTracked(trackedRow?.id ? trackedRow : trackedRow?.qboInvoiceId ? trackedRow : null);
    } catch (e: any) {
      setError(e.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const praLines = useMemo(() => buildPraLines(invoice), [invoice]);
  const lineTotals = useMemo(() => sumPraLines(praLines), [praLines]);
  const billAddress = useMemo(() => addressLines(invoice?.BillAddr), [invoice]);
  const shipAddress = useMemo(() => addressLines(invoice?.ShipAddr), [invoice]);
  const fiscalNo =
    tracked?.fiscalInvoiceNo ||
    customField(invoice, 'Fiscal Invoice') ||
    customField(invoice, 'Fiscal Invoice No');
  const hsCode = customField(invoice, 'HS Code');
  const praStatus = tracked?.status || 'PENDING';
  const isPosted = praStatus === 'POSTED';

  const displayLines = useMemo(() => {
    if (!editing || !draft) return praLines;
    return draft.lines.map((line, index) => ({
      id: line.id || String(index),
      itemCode: line.itemCode,
      itemName: line.itemName,
      qty: Number(line.qty) || 0,
      pctCode: line.pctCode || null,
      taxRate: Number(line.taxRate) || 0,
      saleValue: Number(line.saleValue) || 0,
      taxCharged: Number(line.taxCharged) || 0,
      discount: Number(line.discount) || 0,
      furtherTax: Number(line.furtherTax) || 0,
      totalAmount: Number(line.totalAmount) || 0,
      invoiceType: Number(line.invoiceType) || 1,
      refUsin: line.refUsin || null,
    }));
  }, [draft, editing, praLines]);

  const displayTotals = useMemo(() => {
    if (!editing || !draft) return lineTotals;
    return {
      qty: Number(draft.totals.totalQty) || 0,
      saleValue: Number(draft.totals.totalSaleValue) || 0,
      taxCharged: Number(draft.totals.totalTax) || 0,
      discount: Number(draft.totals.totalDisc) || 0,
      furtherTax: Number(draft.totals.totalFurtherTax) || 0,
      totalAmount: Number(draft.totals.totalAmount) || 0,
    };
  }, [draft, editing, lineTotals]);

  function startEdit() {
    const savedDraft = (tracked?.praPayload as any)?.draft as Partial<InvoiceDraft> | undefined;
    setDraft(
      buildDraftFromSources(
        invoice,
        praLines,
        lineTotals,
        fiscalNo,
        hsCode,
        billAddress,
        shipAddress,
        savedDraft,
      ),
    );
    setEditing(true);
    setMsg('');
    setError('');
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
  }

  function updateDraft(updater: (current: InvoiceDraft) => InvoiceDraft) {
    setDraft((current) => (current ? updater(current) : current));
  }

  async function saveDraft() {
    if (!invoice?.Id || !draft) return;
    setSaving(true);
    setError('');
    setMsg('');
    try {
      await api(`/customer/invoices/${encodeURIComponent(String(invoice.Id))}/draft`, {
        method: 'PATCH',
        body: JSON.stringify({
          qboInvoiceId: String(invoice.Id),
          header: draft.header,
          customer: draft.customer,
          lines: draft.lines,
          totals: draft.totals,
          usin: draft.header.docNumber || String(invoice.Id),
          customerName: draft.customer.name || undefined,
          totalAmount:
            Number(draft.totals.totalAmount) ||
            (invoice.TotalAmt != null ? Number(invoice.TotalAmt) : undefined),
        }),
      });
      setMsg('Invoice changes saved.');
      setEditing(false);
      setDraft(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to save invoice changes');
    } finally {
      setSaving(false);
    }
  }

  async function postToPra() {
    if (!invoice?.Id) return;
    setPosting(true);
    setError('');
    setMsg('');
    try {
      const result = await api('/customer/invoices/post-pra', {
        method: 'POST',
        body: JSON.stringify({
          qboInvoiceId: String(invoice.Id),
          writeToQbo: true,
        }),
      });
      const praMessage = result.praMessage || result.praResponse?.Response;
      setMsg(
        result.qboWriteVerified
          ? `Posted to PRA (${result.fiscalInvoiceNo}). ${praMessage || ''}`.trim()
          : `Posted to PRA (${result.fiscalInvoiceNo}). ${praMessage || ''}`.trim(),
      );
      setConfirmPost(false);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to post invoice to PRA');
      setConfirmPost(false);
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <PageLoader label="Loading invoice details…" />;
  if (error && !invoice) return <div className="error-box">{error}</div>;
  if (!invoice) return null;

  const header = editing && draft ? draft.header : null;
  const customer = editing && draft ? draft.customer : null;
  const totals = editing && draft ? draft.totals : null;

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
            disabled={editing}
            onClick={() =>
              navigate(`/app/invoices/${encodeURIComponent(String(invoice.Id))}/print`)
            }
          >
            View Invoice
          </button>
          {!editing ? (
            <button
              className="btn btn-ghost"
              disabled={isPosted}
              onClick={startEdit}
            >
              Edit
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" disabled={saving} onClick={cancelEdit}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={saveDraft}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
          <button
            className="btn btn-primary"
            disabled={posting || editing || isPosted}
            onClick={() => setConfirmPost(true)}
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

      {tracked?.praResponse && !editing && (
        <div className="card pra-response-card">
          <strong>Last PRA response</strong>
          <pre>{JSON.stringify(tracked.praResponse, null, 2)}</pre>
        </div>
      )}

      <div className="invoice-detail-grid">
        <Section title="Header">
          <div className="invoice-detail-fields">
            <Field
              label="Invoice no"
              value={header ? header.docNumber : text(invoice.DocNumber)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, docNumber: v } }))
              }
            />
            <Field
              label="Invoice date"
              value={header ? header.txnDate : date(invoice.TxnDate)}
              editing={editing}
              type="date"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, txnDate: v } }))
              }
            />
            <Field
              label="Due date"
              value={header ? header.dueDate : date(invoice.DueDate)}
              editing={editing}
              type="date"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, dueDate: v } }))
              }
            />
            <Field
              label="Terms"
              value={header ? header.terms : text(invoice.SalesTermRef?.name)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, terms: v } }))
              }
            />
            <Field
              label="Email status"
              value={header ? header.emailStatus : text(invoice.EmailStatus)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, emailStatus: v } }))
              }
            />
            <Field
              label="Print status"
              value={header ? header.printStatus : text(invoice.PrintStatus)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, printStatus: v } }))
              }
            />
            <Field
              label="HS Code"
              value={header ? header.hsCode : text(hsCode)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, hsCode: v } }))
              }
            />
            <Field
              label="Fiscal Invoice"
              value={header ? header.fiscalInvoice : text(fiscalNo)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, header: { ...d.header, fiscalInvoice: v } }))
              }
            />
            <Field label="PRA status" value={<StatusChip status={praStatus} />} />
          </div>
        </Section>

        <Section title="Customer">
          <div className="invoice-detail-fields">
            <Field
              label="Customer name"
              value={customer ? customer.name : text(invoice.CustomerRef?.name)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, customer: { ...d.customer, name: v } }))
              }
            />
            <Field
              label="Customer ID"
              value={customer ? customer.id : text(invoice.CustomerRef?.value)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, customer: { ...d.customer, id: v } }))
              }
            />
            <Field
              label="Bill to"
              value={
                customer ? (
                  customer.billTo
                ) : billAddress.length ? (
                  <div className="address-stack">
                    {billAddress.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, customer: { ...d.customer, billTo: v } }))
              }
            />
            <Field
              label="Ship to"
              value={
                customer ? (
                  customer.shipTo
                ) : shipAddress.length ? (
                  <div className="address-stack">
                    {shipAddress.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, customer: { ...d.customer, shipTo: v } }))
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
                {(editing && draft ? draft.lines : displayLines).map((row, index) => {
                  const display = displayLines[index] || row;
                  const draftRow = editing && draft ? draft.lines[index] : null;
                  const cell = (
                    key: keyof NonNullable<typeof draftRow>,
                    fallback: React.ReactNode,
                    type: 'text' | 'number' = 'text',
                  ) =>
                    editing && draftRow ? (
                      <input
                        className="invoice-table-input"
                        type={type}
                        value={String(draftRow[key] ?? '')}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateDraft((d) => ({
                            ...d,
                            lines: d.lines.map((line, li) =>
                              li === index ? { ...line, [key]: value } : line,
                            ),
                          }));
                        }}
                      />
                    ) : (
                      fallback
                    );

                  return (
                    <tr key={display.id || index} className="di-invoice-row">
                      <td>{index + 1}</td>
                      <td className="mono">
                        {cell('itemCode', text(display.itemCode, '—'))}
                      </td>
                      <td>{cell('itemName', text(display.itemName))}</td>
                      <td className="num">
                        {cell('qty', fmtQty(display.qty), 'number')}
                      </td>
                      <td className="mono">
                        {cell('pctCode', draftRow?.pctCode ?? display.pctCode ?? 'null')}
                      </td>
                      <td className="num">
                        {cell('taxRate', fmtPct(display.taxRate), 'number')}
                      </td>
                      <td className="num">
                        {cell('saleValue', money(display.saleValue), 'number')}
                      </td>
                      <td className="num">
                        {cell('totalAmount', money(display.totalAmount), 'number')}
                      </td>
                      <td className="num">
                        {cell('taxCharged', money(display.taxCharged), 'number')}
                      </td>
                      <td className="num">
                        {cell('discount', money(display.discount), 'number')}
                      </td>
                      <td className="num">
                        {cell('furtherTax', money(display.furtherTax), 'number')}
                      </td>
                      <td className="num">
                        {cell('invoiceType', display.invoiceType, 'number')}
                      </td>
                      <td className="mono">
                        {cell('refUsin', display.refUsin ?? 'null')}
                      </td>
                    </tr>
                  );
                })}
                {!displayLines.length && (
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
            <Field
              label="Total qty"
              value={totals ? totals.totalQty : fmtQty(displayTotals.qty)}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, totalQty: v } }))
              }
            />
            <Field
              label="Total sale value"
              value={totals ? totals.totalSaleValue : money(displayTotals.saleValue)}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, totalSaleValue: v } }))
              }
            />
            <Field
              label="Total sales tax"
              value={totals ? totals.totalTax : money(displayTotals.taxCharged)}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, totalTax: v } }))
              }
            />
            <Field
              label="Total disc."
              value={totals ? totals.totalDisc : money(displayTotals.discount)}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, totalDisc: v } }))
              }
            />
            <Field
              label="Total further tax"
              value={totals ? totals.totalFurtherTax : money(displayTotals.furtherTax)}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, totalFurtherTax: v } }))
              }
            />
            <Field
              label="Total amt"
              value={totals ? totals.totalAmount : money(displayTotals.totalAmount)}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, totalAmount: v } }))
              }
            />
            <Field label="Invoice total (QBO)" value={money(invoice.TotalAmt)} />
            <Field label="Balance due" value={money(invoice.Balance)} />
            <Field
              label="Payment mode"
              value={totals ? totals.paymentMode : '1'}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, paymentMode: v } }))
              }
            />
            <Field
              label="Inv type"
              value={totals ? totals.invoiceType : '1'}
              editing={editing}
              type="number"
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, invoiceType: v } }))
              }
            />
            <Field
              label="Ref USIN"
              value={totals ? totals.refUsin : 'null'}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, refUsin: v } }))
              }
            />
            <Field
              label="Customer memo"
              value={totals ? totals.customerMemo : text(invoice.CustomerMemo?.value)}
              editing={editing}
              onChange={(v) =>
                updateDraft((d) => ({ ...d, totals: { ...d.totals, customerMemo: v } }))
              }
            />
          </div>
        </Section>
      </div>

      <ConfirmModal
        open={confirmPost}
        title="Post invoice to PRA?"
        body={`This will submit invoice ${text(invoice.DocNumber, String(invoice.Id))} to the official PRA PostData API using your configured POS ID and token. Continue?`}
        confirmLabel="Post to PRA"
        busy={posting}
        onCancel={() => setConfirmPost(false)}
        onConfirm={postToPra}
      />
    </div>
  );
}

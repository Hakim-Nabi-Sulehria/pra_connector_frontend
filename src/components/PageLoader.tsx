export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

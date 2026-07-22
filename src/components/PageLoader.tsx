export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-orb" aria-hidden="true">
        <span className="page-loader-ring page-loader-ring-a" />
        <span className="page-loader-ring page-loader-ring-b" />
        <span className="page-loader-ring page-loader-ring-c" />
        <span className="page-loader-core">
          <span className="page-loader-core-glow" />
          <span className="page-loader-mark">PRA</span>
        </span>
      </div>
      <div className="page-loader-copy">
        <p className="page-loader-label">{label}</p>
        <div className="page-loader-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

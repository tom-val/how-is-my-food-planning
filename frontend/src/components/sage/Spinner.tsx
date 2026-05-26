export function Spinner({ inline = false }: { inline?: boolean }) {
  if (inline) return <span className="fp-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />;
  return (
    <div className="fp-loading">
      <span className="fp-spinner" />
    </div>
  );
}

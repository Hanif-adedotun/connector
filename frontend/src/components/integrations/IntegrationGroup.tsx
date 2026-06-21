interface IntegrationGroupProps {
  label?: string;
  children: React.ReactNode;
}

export function IntegrationGroup({ label, children }: IntegrationGroupProps) {
  return (
    <section className="space-y-3">
      {label && (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-400">
          {label}
        </p>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

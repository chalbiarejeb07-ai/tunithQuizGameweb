type StatCardProps = { icon: string; label: string; value: string; detail: string; tone?: 'rose' | 'blue' | 'gold' | 'green' }

export function StatCard({ icon, label, value, detail, tone = 'rose' }: StatCardProps) {
  return <article className="stat-card"><span className={`stat-icon stat-${tone}`}>{icon}</span><div><strong>{value}</strong><h3>{label}</h3><p>{detail}</p></div></article>
}

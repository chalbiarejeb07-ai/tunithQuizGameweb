/**
 * Graphiques du tableau de bord — construits à la main, sans librairie.
 *
 * Les trois graphiques représentent une seule série de grandeurs : ils utilisent
 * donc une teinte unique pour toutes les barres (et non une couleur par
 * catégorie, qui encoderait deux fois la même information). Les valeurs sont
 * lisibles directement, l'infobulle ne fait que compléter.
 */

type Point = { label: string; value: number }

function niceCeiling(value: number): number {
  if (value <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

/** Histogramme vertical — activité dans le temps. */
export function ActivityChart({ data, caption }: { data: Point[]; caption: string }) {
  const peak = Math.max(...data.map((point) => point.value), 0)
  const ceiling = niceCeiling(peak)
  const peakIndex = data.findIndex((point) => point.value === peak && peak > 0)

  return <figure className="chart">
    <figcaption className="chart-caption">{caption}</figcaption>
    <div className="chart-plot">
      <div className="chart-grid" aria-hidden="true">
        {[1, 0.5, 0].map((ratio) => <div className="chart-grid-line" key={ratio}><span>{Math.round(ceiling * ratio)}</span></div>)}
      </div>
      <div className="chart-columns">
        {data.map((point, index) => <div className="chart-column" key={point.label} title={`${point.label} · ${point.value}`}>
          {index === peakIndex && <span className="chart-column-value">{point.value}</span>}
          <div className="chart-column-bar" style={{ height: `${ceiling ? (point.value / ceiling) * 100 : 0}%` }} />
          <span className="chart-column-label">{data.length > 10 && index % 2 === 1 ? '' : point.label}</span>
        </div>)}
      </div>
    </div>
  </figure>
}

/** Barres horizontales triées — répartition par catégorie. */
export function BreakdownChart({ data, caption, emptyLabel }: { data: Point[]; caption: string; emptyLabel: string }) {
  const sorted = [...data].sort((left, right) => right.value - left.value)
  const peak = Math.max(...sorted.map((point) => point.value), 1)

  return <figure className="chart">
    <figcaption className="chart-caption">{caption}</figcaption>
    {sorted.length === 0
      ? <p className="chart-empty">{emptyLabel}</p>
      : <div className="chart-rows">
        {sorted.map((point) => <div className="chart-row" key={point.label}>
          <span className="chart-row-label" title={point.label}>{point.label}</span>
          <span className="chart-row-track"><span className="chart-row-bar" style={{ width: `${(point.value / peak) * 100}%` }} /></span>
          <span className="chart-row-value">{point.value}</span>
        </div>)}
      </div>}
  </figure>
}

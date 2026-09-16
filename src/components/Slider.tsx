type SliderProps = { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }

export function Slider({ label, value, min, max, suffix, onChange }: SliderProps) {
  return <div className="design-slider"><label><span>{label}</span><strong>{value} {suffix}</strong></label><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><div><small>{min}</small><small>{max}</small></div></div>
}

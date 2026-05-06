/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'

const START_DATE = new Date('2025-07-19T00:00:00')
const END_DATE = new Date('2026-05-05T00:00:00')
const TOTAL_DAYS = Math.round((END_DATE.getTime() - START_DATE.getTime()) / 86400000)

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dayToDate(days: number): Date {
  const d = new Date(START_DATE)
  d.setDate(d.getDate() + days)
  return d
}

const CATEGORIES = ['house', 'misc', 'interest', 'total'] as const
type Category = typeof CATEGORIES[number]

const PAYMENT_TYPES = ['cash', 'cpf', 'total'] as const
type PaymentTypes = typeof PAYMENT_TYPES[number]

const ACCENT = '#8b5cf6'

const ENTITY_COLORS: Record<'jackie' | 'xin' | 'dj' | 'ocbc', string> = {
  jackie: '#3b82f6',
  xin: '#f59e0b',
  dj: '#ef4444',
  ocbc: '#8b5cf6',
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

type SheetData = {
  dates: string[];
  jackieCashHouse: number[];
  xinCashHouse: number[];
  dj: number[];
  ocbc: number[];
  jackieCPFHouse: number[];
  xinCPFHouse: number[];
  jackieCashMisc: number[];
  xinCashMisc: number[];
  jackieCPFMisc: number[];
  xinCPFMisc: number[];
  jackieCashInterest: number[];
  xinCashInterest: number[];
  jackieCPFInterest: number[];
  xinCPFInterest: number[];
};

function App() {
  const [value, setValue] = useState(TOTAL_DAYS)
  const [category, setCategory] = useState<Category>('total')
  const [column, setColumn] = useState<PaymentTypes>('total')
  const [excludeOcbc, setExcludeOcbc] = useState(false)
  const [data, setData] = useState<SheetData>({
    dates: [],
    jackieCashHouse: [],
    xinCashHouse: [],
    dj: [],
    ocbc: [],
    jackieCPFHouse: [],
    xinCPFHouse: [],
    jackieCashMisc: [],
    xinCashMisc: [],
    jackieCPFMisc: [],
    xinCPFMisc: [],
    jackieCashInterest: [],
    xinCashInterest: [],
    jackieCPFInterest: [],
    xinCPFInterest: [],
  });

  const getDataFromSheets = () => {
    return new Promise<SheetData>((resolve, reject) => {
      const runner = (window as any).google?.script?.run;

      if (!runner) {
        reject(new Error("google.script.run not available"));
        return;
      }

      runner
        .withSuccessHandler((result: any) => resolve(result))
        .withFailureHandler((error: any) => reject(error))
        .getChartData();
    });
  }

  const fetchData = async () => {
    try {
      const res = await getDataFromSheets();
      setData(res);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSliderChange = (days: number) => {
    setValue(days);
  }

  const selectedDate = dayToDate(value)
  const accent = ACCENT
  const pct = Math.round((value / TOTAL_DAYS) * 100)
  const idx = data.dates.findLastIndex(d => d <= selectedDate.toISOString())

  const cellValue = (person: 'jackie' | 'xin', type: 'Cash' | 'CPF'): number => {
    if (idx < 0) return 0
    if (category === 'total') {
      return (['House', 'Misc', 'Interest'] as const).reduce((sum, cat) => {
        const key = `${person}${type}${cat}` as keyof SheetData
        return sum + ((data[key] as number[])[idx] ?? 0)
      }, 0)
    }
    const cat = category[0].toUpperCase() + category.slice(1)
    const key = `${person}${type}${cat}` as keyof SheetData
    return (data[key] as number[])[idx] ?? 0
  }

  const loanValue = (source: 'dj' | 'ocbc', type: 'Cash' | 'CPF'): number => {
    if (idx < 0) return 0
    if (type !== 'Cash') return 0
    if (category !== 'house' && category !== 'total') return 0
    return data[source][idx] ?? 0
  }

  const fmt = (n: number | null | undefined) =>
    n == null || Number.isNaN(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 0 })

  type RowKey = 'jackie' | 'xin' | 'dj' | 'ocbc'
  const rowCash = (k: RowKey) => k === 'dj' || k === 'ocbc' ? loanValue(k, 'Cash') : cellValue(k, 'Cash')
  const rowCpf = (k: RowKey) => k === 'dj' || k === 'ocbc' ? loanValue(k, 'CPF') : cellValue(k, 'CPF')
  const sumRows = (keys: RowKey[]) => {
    const cash = keys.reduce((s, k) => s + rowCash(k), 0)
    const cpf = keys.reduce((s, k) => s + rowCpf(k), 0)
    return { cash, cpf }
  }

  const entities: RowKey[] = excludeOcbc
    ? ['jackie', 'xin', 'dj']
    : ['jackie', 'xin', 'dj', 'ocbc']

  const tableRows: { label: string; cash: number; cpf: number; emphasize?: boolean }[] = [
    ...entities.map(k => ({
      label: k,
      cash: rowCash(k),
      cpf: rowCpf(k),
    })),
    { label: 'total', ...sumRows(entities) },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: '1.25rem',
        padding: '2rem',
        width: '360px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        border: '1px solid #334155',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
            Selected date
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '1.75rem' }}>
          <style>{`
            .date-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 6px;
              border-radius: 3px;
              background: linear-gradient(to right, ${accent} ${pct}%, #334155 ${pct}%);
              outline: none;
              cursor: pointer;
            }
            .date-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: ${accent};
              box-shadow: 0 0 0 4px ${accent}33;
              cursor: pointer;
              transition: box-shadow 0.15s;
            }
            .date-slider::-webkit-slider-thumb:hover {
              box-shadow: 0 0 0 7px ${accent}44;
            }
            .date-slider::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border: none;
              border-radius: 50%;
              background: ${accent};
              box-shadow: 0 0 0 4px ${accent}33;
              cursor: pointer;
            }
          `}</style>
          <input
            className="date-slider"
            type="range"
            min={0}
            max={TOTAL_DAYS}
            value={value}
            onChange={e => handleSliderChange(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(START_DATE)}</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(END_DATE)}</span>
          </div>
        </div>

        {/* Payment Type & Category dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              Payment Type
            </p>
            <select
              value={column}
              onChange={e => setColumn(e.target.value as PaymentTypes)}
              style={{
                width: '100%',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.6rem',
                border: `1.5px solid ${ACCENT}`,
                background: `${ACCENT}22`,
                color: ACCENT,
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                outline: 'none',
                appearance: 'none',
              }}
            >
              {PAYMENT_TYPES.map(col => (
                <option key={col} value={col} style={{ background: '#1e293b', color: '#f1f5f9' }}>{col}</option>
              ))}
            </select>
          </div>
          <div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              Category
            </p>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              style={{
                width: '100%',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.6rem',
                border: `1.5px solid ${accent}`,
                background: `${accent}22`,
                color: accent,
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                outline: 'none',
                appearance: 'none',
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ background: '#1e293b', color: '#f1f5f9' }}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exclude OCBC toggle */}
        <button
          onClick={() => setExcludeOcbc(!excludeOcbc)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1rem',
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Exclude OCBC loan</span>
          <span style={{
            position: 'relative',
            display: 'inline-block',
            width: 36,
            height: 20,
            borderRadius: 10,
            background: excludeOcbc ? ACCENT : '#334155',
            transition: 'background 0.15s',
          }}>
            <span style={{
              position: 'absolute',
              top: 2,
              left: excludeOcbc ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#f1f5f9',
              transition: 'left 0.15s',
            }} />
          </span>
        </button>

        {/* Snapshot values */}
        {idx >= 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              Values
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: '#64748b', textAlign: 'right' }}>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontWeight: 500 }}></th>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 500 }}>contribution</th>
                </tr>
              </thead>
              <tbody style={{ color: '#f1f5f9' }}>
                {tableRows.map(row => {
                  const v = column === 'cash' ? row.cash : column === 'cpf' ? row.cpf : row.cash + row.cpf
                  return (
                    <tr
                      key={row.label}
                      style={{
                        textAlign: 'right',
                        borderTop: row.emphasize ? '2px solid #475569' : '1px solid #334155',
                        fontWeight: row.emphasize ? 600 : 400,
                      }}
                    >
                      <td style={{ padding: '0.4rem', textAlign: 'left', color: '#94a3b8' }}>{row.label}</td>
                      <td style={{ padding: '0.4rem' }}>{fmt(v)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Contribution pie chart */}
        {idx >= 0 && (() => {
          const slices = entities.map(k => {
            const row = tableRows.find(r => r.label === k)!
            const value = column === 'cash' ? row.cash : column === 'cpf' ? row.cpf : row.cash + row.cpf
            return { label: k, value, color: ENTITY_COLORS[k] }
          })
          const total = slices.reduce((s, d) => s + d.value, 0)
          if (total <= 0) return null

          const nonZero = slices.filter(d => d.value > 0)
          let angle = 0

          return (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
                {column} contribution to {category}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, flexShrink: 0 }}>
                  {nonZero.length === 1 ? (
                    <circle cx={50} cy={50} r={48} fill={nonZero[0].color} />
                  ) : (
                    slices.map(d => {
                      if (d.value === 0) return null
                      const start = angle
                      const end = angle + (d.value / total) * 360
                      angle = end
                      return <path key={d.label} d={arcPath(50, 50, 48, start, end)} fill={d.color} />
                    })
                  )}
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', flex: 1 }}>
                  {slices.map(d => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ color: '#94a3b8', flex: 1 }}>{d.label}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 500 }}>
                        {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}

export default App

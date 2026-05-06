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

const CATEGORY_COLORS: Record<Category, string> = {
  house: '#3b82f6',
  misc: '#f59e0b',
  interest: '#ef4444',
  total: '#8b5cf6',
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

  const onDateChange = (date: Date) => {
    console.log('TEST', date);
  }

  const handleSliderChange = (days: number) => {
    setValue(days);
  }

  const selectedDate = dayToDate(value)
  const accent = CATEGORY_COLORS[category]
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

  const tableRows: { label: string; cash: number; cpf: number; emphasize?: boolean }[] = [
    ...(['jackie', 'xin', 'dj', 'ocbc'] as const).map(k => ({
      label: k,
      cash: rowCash(k),
      cpf: rowCpf(k),
    })),
    { label: 'total', ...sumRows(['jackie', 'xin', 'dj']), emphasize: true },
    { label: 'total (with loan)', ...sumRows(['jackie', 'xin', 'dj', 'ocbc']) },
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
            onPointerUp={e => onDateChange(dayToDate(Number((e.target as HTMLInputElement).value)))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(START_DATE)}</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(END_DATE)}</span>
          </div>
        </div>

        {/* Category pills */}
        <div>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
            Category
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {CATEGORIES.map(cat => {
              const active = cat === category
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.6rem',
                    border: `1.5px solid ${active ? CATEGORY_COLORS[cat] : '#334155'}`,
                    background: active ? `${CATEGORY_COLORS[cat]}22` : 'transparent',
                    color: active ? CATEGORY_COLORS[cat] : '#94a3b8',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

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
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 500 }}>cash</th>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 500 }}>cpf</th>
                  <th style={{ padding: '0.35rem 0.4rem', fontWeight: 500 }}>total</th>
                </tr>
              </thead>
              <tbody style={{ color: '#f1f5f9' }}>
                {tableRows.map(row => (
                  <tr
                    key={row.label}
                    style={{
                      textAlign: 'right',
                      borderTop: row.emphasize ? '2px solid #475569' : '1px solid #334155',
                      fontWeight: row.emphasize ? 600 : 400,
                    }}
                  >
                    <td style={{ padding: '0.4rem', textAlign: 'left', color: '#94a3b8' }}>{row.label}</td>
                    <td style={{ padding: '0.4rem' }}>{fmt(row.cash)}</td>
                    <td style={{ padding: '0.4rem' }}>{fmt(row.cpf)}</td>
                    <td style={{ padding: '0.4rem' }}>{fmt(row.cash + row.cpf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default App

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
  console.log('TEST selected', selectedDate, 'idx', idx);
  const snapshot = idx >= 0
    ? (Object.entries(data) as [keyof SheetData, number[] | string[]][])
        .filter(([k]) => k !== 'dates')
        .map(([k, arr]) => [k, (arr as number[])[idx]] as const)
    : []

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
        {snapshot.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              Values
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {snapshot.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>{k}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{v?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App

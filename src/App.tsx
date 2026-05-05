import { useState } from 'react'

const START_DATE = new Date('2025-07-19')
const END_DATE = new Date('2026-05-05')
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

function App() {
  const [value, setValue] = useState(TOTAL_DAYS)
  const [category, setCategory] = useState<Category>('total')

  const selectedDate = dayToDate(value)
  const accent = CATEGORY_COLORS[category]
  const pct = Math.round((value / TOTAL_DAYS) * 100)

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
            onChange={e => setValue(Number(e.target.value))}
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

      </div>
    </div>
  )
}

export default App

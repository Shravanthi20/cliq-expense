import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { saveAs } from 'file-saver';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function toMonthKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

const ForecastPage = () => {
  const { token } = useAuth();
  const [month, setMonth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const monthInputValue = useMemo(() => month || '', [month]);

  function nextMonthKey(key) {
    try {
      const [yStr, mStr] = String(key).split('-');
      let y = Number(yStr);
      let m = Number(mStr);
      if (!y || !m) return toMonthKey(new Date());
      m += 1;
      if (m > 12) { y += 1; m = 1; }
      return `${y}-${String(m).padStart(2, '0')}`;
    } catch {
      return toMonthKey(new Date());
    }
  }

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError('');
      const params = month ? { month } : undefined;
      const resp = await api.get(`/forecast/expense`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(resp.data);
      if (!month && resp?.data?.month) {
        setMonth(resp.data.month);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load forecast';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <h1>Expense Forecast</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              Month:
              <input
                type="month"
                value={monthInputValue}
                onChange={(e) => setMonth(e.target.value)}
                style={{ marginLeft: 8 }}
              />
            </label>
            <button onClick={fetchForecast} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button
              onClick={async () => {
                try {
                  const params = month ? { month } : undefined;
                  const resp = await api.get(`/forecast/expense/report`, {
                    params,
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                  });
                  const blob = new Blob([resp.data], { type: 'text/plain;charset=utf-8' });
                  const filename = `forecast_${month || (data?.month) || toMonthKey(new Date())}.txt`;
                  saveAs(blob, filename);
                } catch (err) {
                  const msg = err?.response?.data?.message || err.message || 'Failed to download report';
                  setError(msg);
                }
              }}
              disabled={loading}
            >
              Download Report
            </button>
            <button
              onClick={() => {
                const base = month || (data?.month) || toMonthKey(new Date());
                const nm = nextMonthKey(base);
                setMonth(nm);
                // trigger fetch after state update
                setTimeout(fetchForecast, 0);
              }}
              disabled={loading}
            >
              Next Month
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {data && (
        <div className="grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
          <div className="card" style={{ gridColumn: '1 / span 2' }}>
            <div className="card-body">
              <h3 style={{ marginTop: 0 }}>Monthly Expenses (with Forecast)</h3>
              <div style={{ width: '100%', minHeight: 300 }}>
                <Line
                  data={{
                    labels: [...data.history.map(h => h.month), data.month],
                    datasets: [
                      {
                        label: 'Expense (history)',
                        data: data.history.map(h => Number(h.expense || 0)),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.15)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 3,
                        spanGaps: true,
                      },
                      {
                        label: 'Forecast',
                        data: [
                          ...data.history.map(() => null),
                          Number(data.forecastExpense || 0)
                        ],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.3,
                        fill: false,
                        pointRadius: 5,
                        pointStyle: 'triangle',
                        borderDash: [6, 6],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false, text: 'Expense Trend' },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const v = ctx.parsed.y;
                            if (v == null) return '';
                            return `${ctx.dataset.label}: ₹ ${Number(v).toLocaleString()}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) => `₹ ${Number(value).toLocaleString()}`,
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h2 style={{ marginTop: 0 }}>Forecast for {data.month}</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                ₹ {Number(data.forecastExpense).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: 12, color: '#555' }}>
                <div>To‑date Expense: ₹ {Number(data.components.expenseMonthToDate).toLocaleString()}</div>
                <div>To‑date Income: ₹ {Number(data.components.incomeMonthToDate).toLocaleString()}</div>
                <div>Model Used: {data.modelUsed || 'heuristic'}</div>
                <div>Income Adjustment: {data.components.incomeAdjustment}</div>
                <div>To‑date Projection: ₹ {Number(data.components.toDateProjection).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ marginTop: 0 }}>Method Components</h3>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Avg Expense (last 3): ₹ {Number(data.components.avgExpenseLast3).toLocaleString()}</li>
                <li>Avg Income (last 3): ₹ {Number(data.components.avgIncomeLast3).toLocaleString()}</li>
                <li>Preliminary: ₹ {Number(data.components.preliminary).toLocaleString()}</li>
                <li>Days Passed / Total: {data.components.daysPassed} / {data.components.totalDays}</li>
                {data.modelCoefficients && (
                  <li>
                    Coefficients: β0={data.modelCoefficients.intercept}, β1(income)={data.modelCoefficients.coefIncome}, β2(prevExpense)={data.modelCoefficients.coefPrevExpense}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / span 2' }}>
            <div className="card-body">
              <h3 style={{ marginTop: 0 }}>History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Month</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Income</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #eee' }}>Expense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((h) => (
                      <tr key={h.month}>
                        <td style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>{h.month}</td>
                        <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #f5f5f5' }}>₹ {Number(h.income).toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #f5f5f5' }}>₹ {Number(h.expense).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastPage;



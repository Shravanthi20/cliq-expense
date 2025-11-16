const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const mongoose = require('mongoose');

function monthKey(date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

function startOfMonthUtc(year, month) {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}

function endOfMonthUtc(year, month) {
  const d = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return d;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function invert3(m) {
  // Invert 3x3 matrix using adjugate/determinant; m is [[a,b,c],[d,e,f],[g,h,i]]
  const a = m[0][0], b = m[0][1], c = m[0][2];
  const d = m[1][0], e = m[1][1], f = m[1][2];
  const g = m[2][0], h = m[2][1], i = m[2][2];
  const A = (e*i - f*h), B = -(d*i - f*g), C = (d*h - e*g);
  const D = -(b*i - c*h), E = (a*i - c*g), F = -(a*h - b*g);
  const G = (b*f - c*e), H = -(a*f - c*d), I = (a*e - b*d);
  const det = a*A + b*B + c*C;
  if (!isFinite(det) || Math.abs(det) < 1e-9) return null;
  const invDet = 1 / det;
  return [
    [A * invDet, D * invDet, G * invDet],
    [B * invDet, E * invDet, H * invDet],
    [C * invDet, F * invDet, I * invDet],
  ];
}

function multiply3x3_3x1(m, v) {
  return [
    m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
    m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
    m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2],
  ];
}

function fitOlsWithIntercept(samples) {
  // samples: [{income, prevExpense, expense}]
  // X: [1, income, prevExpense], y: expense
  // beta = (X^T X)^{-1} X^T y
  const n = samples.length;
  if (n < 4) return null; // need enough data

  let s00 = 0, s01 = 0, s02 = 0;
  let s11 = 0, s12 = 0, s22 = 0;
  let t0 = 0, t1 = 0, t2 = 0;
  for (const r of samples) {
    const x0 = 1;
    const x1 = Number(r.income) || 0;
    const x2 = Number(r.prevExpense) || 0;
    const y = Number(r.expense) || 0;
    s00 += x0 * x0; // = n
    s01 += x0 * x1;
    s02 += x0 * x2;
    s11 += x1 * x1;
    s12 += x1 * x2;
    s22 += x2 * x2;
    t0 += x0 * y;
    t1 += x1 * y;
    t2 += x2 * y;
  }
  const XtX = [
    [s00, s01, s02],
    [s01, s11, s12],
    [s02, s12, s22],
  ];
  const XtY = [t0, t1, t2];
  const inv = invert3(XtX);
  if (!inv) return null;
  const beta = multiply3x3_3x1(inv, XtY); // [b0, b1, b2]
  if (!beta.every(v => isFinite(v))) return null;
  return { intercept: beta[0], coefIncome: beta[1], coefPrevExpense: beta[2] };
}

function toObjectIdOrNull(id) {
  try {
    if (!id) return null;
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
}

// GET /api/forecast/expense?month=YYYY-MM
router.get('/expense', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = toObjectIdOrNull(userId);
    if (!userObjectId) {
      return res.status(400).json({ message: 'Invalid user id in token' });
    }

    // Aggregate monthly expenses and incomes historically for this user
    const [expenseAgg, incomeAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { user_id: userObjectId } },
        { $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: '$amount' }
        } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
      Income.aggregate([
        { $match: { user_id: userObjectId } },
        { $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: '$amount' }
        } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ])
    ]);

    const monthly = {};
    for (const row of incomeAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      monthly[key].income = row.total;
    }
    for (const row of expenseAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      monthly[key].expense = row.total;
    }

    // After building monthly history, determine target month
    const keysAll = Object.keys(monthly).sort();
    const latestDataMonth = keysAll[keysAll.length - 1] || null;

    function nextMonthKey(key) {
      const [yStr, mStr] = String(key).split('-');
      let y = Number(yStr);
      let m = Number(mStr);
      if (!y || !m) return monthKey(new Date());
      m += 1;
      if (m > 12) { y += 1; m = 1; }
      return `${y}-${String(m).padStart(2, '0')}`;
    }

    let targetMonthKey = undefined;
    let defaultedToNext = false;
    if (req.query.month) {
      targetMonthKey = String(req.query.month);
    } else if (latestDataMonth) {
      targetMonthKey = nextMonthKey(latestDataMonth);
      defaultedToNext = true;
    } else {
      targetMonthKey = monthKey(new Date());
    }

    const [yearStr, monthStr] = targetMonthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Invalid month. Use YYYY-MM.' });
    }

    const from = startOfMonthUtc(year, month);
    const to = endOfMonthUtc(year, month);

    // Compute selected month to-date totals
    const [expenseToDate, incomeToDate] = await Promise.all([
      Expense.aggregate([
        { $match: {
            user_id: userObjectId,
            date: { $gte: from, $lte: to }
        } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Income.aggregate([
        { $match: {
            user_id: userObjectId,
            date: { $gte: from, $lte: to }
        } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const expenseMonthToDate = expenseToDate?.[0]?.total || 0;
    const incomeMonthToDate = incomeToDate?.[0]?.total || 0;

    // Build arrays of past months excluding current target month
    const keys = Object.keys(monthly).sort();
    const historyKeys = keys.filter(k => k !== targetMonthKey);

    const last3Keys = historyKeys.slice(-3);
    const avgExpenseLast3 = last3Keys.length
      ? last3Keys.reduce((s, k) => s + (monthly[k].expense || 0), 0) / last3Keys.length
      : 0;
    const avgIncomeLast3 = last3Keys.length
      ? last3Keys.reduce((s, k) => s + (monthly[k].income || 0), 0) / last3Keys.length
      : 0;

    const totalDays = daysInMonth(year, month);
    const todayUtc = new Date();
    const isCurrentMonth = monthKey(todayUtc) === targetMonthKey;
    const dayOfMonth = isCurrentMonth ? todayUtc.getUTCDate() : totalDays; // if past month, treat as complete
    const daysPassed = Math.max(1, Math.min(dayOfMonth, totalDays));

    const incomeAdj = avgIncomeLast3 > 0 ? (incomeMonthToDate / avgIncomeLast3) : 1;
    // Heuristic components
    // If forecasting a future month (no to‑date data), avoid zeroing by incomeAdj and ignore to‑date projection
    const preliminary = defaultedToNext
      ? avgExpenseLast3
      : (avgExpenseLast3 > 0 ? (avgExpenseLast3 * incomeAdj) : expenseMonthToDate);

    const toDateProjection = defaultedToNext
      ? preliminary
      : (expenseMonthToDate / daysPassed) * totalDays;

    // Prepare regression samples from history (need previous month's expense)
    const buildSamples = () => {
      const keysSorted = keys.sort();
      const samples = [];
      for (let idx = 1; idx < keysSorted.length; idx++) {
        const k = keysSorted[idx];
        const prevK = keysSorted[idx - 1];
        if (!monthly[k] || !monthly[prevK]) continue;
        // skip target month
        if (k === targetMonthKey) continue;
        samples.push({
          income: monthly[k].income || 0,
          prevExpense: monthly[prevK].expense || 0,
          expense: monthly[k].expense || 0,
        });
      }
      return samples;
    };

    const samples = buildSamples();
    const ols = fitOlsWithIntercept(samples);

    let modelUsed = 'heuristic';
    let forecastExpense = Number(((preliminary + toDateProjection) / 2).toFixed(2));
    let modelCoefficients = null;

    if (ols) {
      modelUsed = 'ols_regression';
      const prevKey = historyKeys.slice(-1)[0];
      const prevExpense = prevKey ? (monthly[prevKey]?.expense || 0) : avgExpenseLast3;
      const yHat = ols.intercept + ols.coefIncome * incomeMonthToDate + ols.coefPrevExpense * prevExpense;
      // If forecasting a future month (no to‑date activity expected), rely more on model
      const blendAlpha = defaultedToNext ? 1.0 : 0.6;
      const blended = blendAlpha * yHat + (1 - blendAlpha) * toDateProjection;
      forecastExpense = Number(Math.max(0, blended).toFixed(2));
      modelCoefficients = {
        intercept: Number(ols.intercept.toFixed(6)),
        coefIncome: Number(ols.coefIncome.toFixed(6)),
        coefPrevExpense: Number(ols.coefPrevExpense.toFixed(6)),
      };
    }

    const response = {
      month: targetMonthKey,
      forecastExpense,
      modelUsed,
      modelCoefficients,
      defaultedToNextMonth: defaultedToNext,
      latestDataMonth,
      components: {
        avgExpenseLast3: Number(avgExpenseLast3.toFixed(2)),
        avgIncomeLast3: Number(avgIncomeLast3.toFixed(2)),
        incomeMonthToDate: Number(incomeMonthToDate.toFixed(2)),
        expenseMonthToDate: Number(expenseMonthToDate.toFixed(2)),
        incomeAdjustment: Number(incomeAdj.toFixed(4)),
        toDateProjection: Number(toDateProjection.toFixed(2)),
        preliminary: Number(preliminary.toFixed(2)),
        totalDays,
        daysPassed
      },
      history: historyKeys.map(k => ({
        month: k,
        income: Number((monthly[k].income || 0).toFixed(2)),
        expense: Number((monthly[k].expense || 0).toFixed(2))
      }))
    };

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to compute forecast', error: err.message });
  }
});

module.exports = router;

// GET /api/forecast/expense/report?month=YYYY-MM
router.get('/expense/report', auth, async (req, res) => {
  try {
    // Reuse the same computation by calling the expense route logic inline
    const userId = req.user.id;
    const userObjectId = toObjectIdOrNull(userId);
    if (!userObjectId) {
      return res.status(400).json({ message: 'Invalid user id in token' });
    }

    // Aggregate monthly expenses and incomes historically for this user
    const [expenseAgg, incomeAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { user_id: userObjectId } },
        { $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: '$amount' }
        } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
      Income.aggregate([
        { $match: { user_id: userObjectId } },
        { $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: '$amount' }
        } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ])
    ]);

    const monthly = {};
    for (const row of incomeAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      monthly[key].income = row.total;
    }
    for (const row of expenseAgg) {
      const key = `${row._id.y}-${String(row._id.m).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      monthly[key].expense = row.total;
    }

    const keysAll = Object.keys(monthly).sort();
    const latestDataMonth = keysAll[keysAll.length - 1] || null;
    function nextMonthKeyReport(key) {
      const [yStr, mStr] = String(key).split('-');
      let y = Number(yStr);
      let m = Number(mStr);
      if (!y || !m) return monthKey(new Date());
      m += 1;
      if (m > 12) { y += 1; m = 1; }
      return `${y}-${String(m).padStart(2, '0')}`;
    }

    let targetMonthKey = undefined;
    let defaultedToNext = false;
    if (req.query.month) {
      targetMonthKey = String(req.query.month);
    } else if (latestDataMonth) {
      targetMonthKey = nextMonthKeyReport(latestDataMonth);
      defaultedToNext = true;
    } else {
      targetMonthKey = monthKey(new Date());
    }

    const [yearStr, monthStr] = targetMonthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Invalid month. Use YYYY-MM.' });
    }

    const from = startOfMonthUtc(year, month);
    const to = endOfMonthUtc(year, month);

    const [expenseToDateArr, incomeToDateArr] = await Promise.all([
      Expense.aggregate([
        { $match: { user_id: userObjectId, date: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Income.aggregate([
        { $match: { user_id: userObjectId, date: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const expenseMonthToDate = expenseToDateArr?.[0]?.total || 0;
    const incomeMonthToDate = incomeToDateArr?.[0]?.total || 0;

    const keys = Object.keys(monthly).sort();
    const historyKeys = keys.filter(k => k !== targetMonthKey);
    const last3Keys = historyKeys.slice(-3);
    const avgExpenseLast3 = last3Keys.length
      ? last3Keys.reduce((s, k) => s + (monthly[k].expense || 0), 0) / last3Keys.length
      : 0;
    const avgIncomeLast3 = last3Keys.length
      ? last3Keys.reduce((s, k) => s + (monthly[k].income || 0), 0) / last3Keys.length
      : 0;

    const totalDays = daysInMonth(year, month);
    const todayUtc = new Date();
    const isCurrentMonth = monthKey(todayUtc) === targetMonthKey;
    const dayOfMonth = isCurrentMonth ? todayUtc.getUTCDate() : totalDays;
    const daysPassed = Math.max(1, Math.min(dayOfMonth, totalDays));

    const incomeAdj = avgIncomeLast3 > 0 ? (incomeMonthToDate / avgIncomeLast3) : 1;
    const preliminary = defaultedToNext
      ? avgExpenseLast3
      : (avgExpenseLast3 > 0 ? (avgExpenseLast3 * incomeAdj) : expenseMonthToDate);
    const toDateProjection = defaultedToNext
      ? preliminary
      : (expenseMonthToDate / daysPassed) * totalDays;

    const buildSamples = () => {
      const keysSorted = keys.sort();
      const samples = [];
      for (let idx = 1; idx < keysSorted.length; idx++) {
        const k = keysSorted[idx];
        const prevK = keysSorted[idx - 1];
        if (!monthly[k] || !monthly[prevK]) continue;
        if (k === targetMonthKey) continue;
        samples.push({
          income: monthly[k].income || 0,
          prevExpense: monthly[prevK].expense || 0,
          expense: monthly[k].expense || 0,
        });
      }
      return samples;
    };
    const samples = buildSamples();
    const ols = fitOlsWithIntercept(samples);

    let modelUsed = 'heuristic';
    let forecastExpense = Number(((preliminary + toDateProjection) / 2).toFixed(2));
    let modelCoefficients = null;
    if (ols) {
      modelUsed = 'ols_regression';
      const prevKey = historyKeys.slice(-1)[0];
      const prevExpense = prevKey ? (monthly[prevKey]?.expense || 0) : avgExpenseLast3;
      const yHat = ols.intercept + ols.coefIncome * incomeMonthToDate + ols.coefPrevExpense * prevExpense;
      const blendAlpha = defaultedToNext ? 1.0 : 0.6;
      const blended = blendAlpha * yHat + (1 - blendAlpha) * toDateProjection;
      forecastExpense = Number(Math.max(0, blended).toFixed(2));
      modelCoefficients = {
        intercept: Number(ols.intercept.toFixed(6)),
        coefIncome: Number(ols.coefIncome.toFixed(6)),
        coefPrevExpense: Number(ols.coefPrevExpense.toFixed(6)),
      };
    }

    const lines = [];
    lines.push(`Expense Forecast Report`);
    lines.push(`Month: ${targetMonthKey}`);
    lines.push(`Model Used: ${modelUsed}`);
    if (modelCoefficients) {
      lines.push(`Coefficients: β0=${modelCoefficients.intercept}, β1(income)=${modelCoefficients.coefIncome}, β2(prevExpense)=${modelCoefficients.coefPrevExpense}`);
    }
    lines.push('');
    lines.push(`Components:`);
    lines.push(`  Avg Expense (last 3): ${avgExpenseLast3}`);
    lines.push(`  Avg Income (last 3): ${avgIncomeLast3}`);
    lines.push(`  Income Month-To-Date: ${incomeMonthToDate}`);
    lines.push(`  Expense Month-To-Date: ${expenseMonthToDate}`);
    lines.push(`  Income Adjustment: ${incomeAdj}`);
    lines.push(`  Preliminary: ${preliminary}`);
    lines.push(`  To-Date Projection: ${toDateProjection}`);
    lines.push(`  Days Passed / Total: ${daysPassed} / ${totalDays}`);
    lines.push('');
    lines.push(`History (month, income, expense):`);
    for (const k of historyKeys) {
      lines.push(`  ${k}, ${monthly[k].income || 0}, ${monthly[k].expense || 0}`);
    }
    lines.push('');
    lines.push(`Final Forecasted Expense: ${forecastExpense}`);

    const content = lines.join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="forecast_${targetMonthKey}.txt"`);
    return res.status(200).send(content);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create report', error: err.message });
  }
});



import React, { useEffect, useState } from 'react';
import { expenseAPI, incomeAPI, uploadAPI } from '../config/api';

function UploadData() {
  const [tab, setTab] = useState('upload'); // upload | expense | income | search
  const [type, setType] = useState('expense');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    date: '', category: '', amount: '', payment_method: 'UPI', description: '', group_id: '', split_equal: false
  });
  const [incomeForm, setIncomeForm] = useState({
    date: '', amount: '', source: 'Salary', payment_method: 'Bank Transfer', notes: '', group_id: ''
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentIncome, setRecentIncome] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [searchForm, setSearchForm] = useState({
    scope: 'expense', // 'expense' | 'income'
    q: '',
    category: '',
    source: '',
    payment_method: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
  });
  const [searchResults, setSearchResults] = useState([]);

  async function fetchRecent() {
    try {
      const [eRes, iRes] = await Promise.all([
        expenseAPI.getAll(),
        incomeAPI.getAll()
      ]);
      setRecentExpenses(eRes.data || []);
      setRecentIncome(iRes.data || []);
    } catch (error) {
      console.error('Error fetching recent data:', error);
      setRecentExpenses([]);
      setRecentIncome([]);
    }
  }

  useEffect(() => { fetchRecent(); }, []);

  async function runSearch(e) {
    if (e) e.preventDefault();
    setMessage('');
    const s = searchForm;
    const params = {};
    
    if (s.q) params.q = s.q;
    if (s.payment_method) params.payment_method = s.payment_method;
    if (s.date_from) params.date_from = s.date_from;
    if (s.date_to) params.date_to = s.date_to;
    if (s.amount_min) params.amount_min = s.amount_min;
    if (s.amount_max) params.amount_max = s.amount_max;
    if (s.scope === 'expense' && s.category) params.category = s.category;
    if (s.scope === 'income' && s.source) params.source = s.source;

    try {
      const response = s.scope === 'expense' 
        ? await expenseAPI.search(params)
        : await incomeAPI.search(params);

      const list = Array.isArray(response.data) ? response.data : [];
      setSearchResults(list);
      if (list.length === 0) setMessage('No results');
    } catch (err) {
      const errText = String(err.response?.data?.message || err.message || err).slice(0, 300);
      setMessage(`Error: ${errText}`);
      setSearchResults([]);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setMessage('');
    if (!file) return setMessage('Please choose a CSV or PDF file');

    setLoading(true);
    try {
      const response = await uploadAPI.uploadFile(file, type);
      const inserted = response.data?.inserted;
      setMessage(`Success${inserted != null ? `: inserted ${inserted} records` : ''}`);
      fetchRecent();
    } catch (err) {
      const errText = String(err.response?.data?.message || err.message || err).slice(0, 300);
      setMessage(`Error: ${errText}`);
    } finally {
      setLoading(false);
    }
  }

  async function createExpense(e) {
    e.preventDefault();
    setMessage('');
    try {
      const isEditing = Boolean(editingExpenseId);
      
      if (isEditing) {
        await expenseAPI.update(editingExpenseId, expenseForm);
      } else {
        await expenseAPI.create(expenseForm);
      }
      
      setExpenseForm({ date: '', category: '', amount: '', payment_method: 'UPI', description: '', group_id: '', split_equal: false });
      setEditingExpenseId(null);
      setMessage(isEditing ? 'Success: expense updated' : 'Success: expense added');
      fetchRecent();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  }

  async function createIncome(e) {
    e.preventDefault();
    setMessage('');
    try {
      const isEditing = Boolean(editingIncomeId);
      
      if (isEditing) {
        await incomeAPI.update(editingIncomeId, incomeForm);
      } else {
        await incomeAPI.create(incomeForm);
      }
      
      setIncomeForm({ date: '', amount: '', source: 'Salary', payment_method: 'Bank Transfer', notes: '', group_id: '' });
      setEditingIncomeId(null);
      setMessage(isEditing ? 'Success: income updated' : 'Success: income added');
      fetchRecent();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  }

  async function deleteExpense(id) {
    try {
      await expenseAPI.delete(id);
      fetchRecent();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }

  async function deleteIncome(id) {
    try {
      await incomeAPI.delete(id);
      fetchRecent();
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  }

  return (
    <div className="card">
      <div className="page-title">Data Management</div>
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className="button" onClick={() => setTab('upload')} style={{ marginRight: 8, background: tab==='upload' ? '#2563eb' : '#6b7280' }}>Upload CSV/PDF</button>
        <button className="button" onClick={() => setTab('expense')} style={{ marginRight: 8, background: tab==='expense' ? '#2563eb' : '#6b7280' }}>Add Expense</button>
        <button className="button" onClick={() => setTab('income')} style={{ marginRight: 8, background: tab==='income' ? '#2563eb' : '#6b7280' }}>Add Income</button>
        <button className="button" onClick={() => setTab('search')} style={{ background: tab==='search' ? '#2563eb' : '#6b7280' }}>Search</button>
      </div>

      {tab === 'upload' && (
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="select" style={{ marginLeft: 8 }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <input className="input" type="file" accept=".csv,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" disabled={loading} className="button">{loading ? 'Uploading…' : 'Upload'}</button>
        </form>
      )}

      {tab === 'expense' && (
        <form onSubmit={createExpense}>
          <div className="form-group"><label className="label">Date</label><input className="input" type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Category</label><input className="input" value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm, category:e.target.value})} placeholder="Food, Rent, Utilities" required /></div>
          <div className="form-group"><label className="label">Amount</label><input className="input" type="number" step="0.01" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Payment Method</label><input className="input" value={expenseForm.payment_method} onChange={e=>setExpenseForm({...expenseForm, payment_method:e.target.value})} placeholder="UPI, Cash, Credit Card" required /></div>
          <div className="form-group"><label className="label">Description</label><input className="input" value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm, description:e.target.value})} placeholder="Optional" /></div>
          <div className="form-group"><label className="label">Group Id (optional)</label><input className="input" value={expenseForm.group_id} onChange={e=>setExpenseForm({...expenseForm, group_id:e.target.value})} /></div>
          <div className="form-group"><label className="label"><input type="checkbox" checked={expenseForm.split_equal} onChange={e=>setExpenseForm({...expenseForm, split_equal:e.target.checked})} /> Split equally among group</label></div>
          <button className="button" type="submit">Add Expense</button>
        </form>
      )}

      {tab === 'income' && (
        <form onSubmit={createIncome}>
          <div className="form-group"><label className="label">Date</label><input className="input" type="date" value={incomeForm.date} onChange={e=>setIncomeForm({...incomeForm, date:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Amount</label><input className="input" type="number" step="0.01" value={incomeForm.amount} onChange={e=>setIncomeForm({...incomeForm, amount:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Source</label><input className="input" value={incomeForm.source} onChange={e=>setIncomeForm({...incomeForm, source:e.target.value})} placeholder="Salary, Business, Freelance" required /></div>
          <div className="form-group"><label className="label">Payment Method</label><input className="input" value={incomeForm.payment_method} onChange={e=>setIncomeForm({...incomeForm, payment_method:e.target.value})} placeholder="Bank Transfer, UPI, Cash" required /></div>
          <div className="form-group"><label className="label">Notes</label><input className="input" value={incomeForm.notes} onChange={e=>setIncomeForm({...incomeForm, notes:e.target.value})} placeholder="Optional" /></div>
          <div className="form-group"><label className="label">Group Id (optional)</label><input className="input" value={incomeForm.group_id} onChange={e=>setIncomeForm({...incomeForm, group_id:e.target.value})} /></div>
          <button className="button" type="submit">Add Income</button>
        </form>
      )}

      {tab === 'search' && (
        <>
          <form onSubmit={runSearch} style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="label">Scope</label>
              <select className="select" value={searchForm.scope} onChange={e=>setSearchForm({...searchForm, scope: e.target.value, category: '', source: ''})} style={{ marginLeft: 8 }}>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="form-group"><label className="label">Text</label><input className="input" placeholder="Search text" value={searchForm.q} onChange={e=>setSearchForm({...searchForm, q: e.target.value})} /></div>
            {searchForm.scope === 'expense' && (
              <div className="form-group"><label className="label">Category</label><input className="input" placeholder="Food, Rent" value={searchForm.category} onChange={e=>setSearchForm({...searchForm, category: e.target.value})} /></div>
            )}
            {searchForm.scope === 'income' && (
              <div className="form-group"><label className="label">Source</label><input className="input" placeholder="Salary, Business" value={searchForm.source} onChange={e=>setSearchForm({...searchForm, source: e.target.value})} /></div>
            )}
            <div className="form-group"><label className="label">Payment Method</label><input className="input" placeholder="UPI, Cash, Card" value={searchForm.payment_method} onChange={e=>setSearchForm({...searchForm, payment_method: e.target.value})} /></div>
            <div className="form-group"><label className="label">Date From</label><input className="input" type="date" value={searchForm.date_from} onChange={e=>setSearchForm({...searchForm, date_from: e.target.value})} /></div>
            <div className="form-group"><label className="label">Date To</label><input className="input" type="date" value={searchForm.date_to} onChange={e=>setSearchForm({...searchForm, date_to: e.target.value})} /></div>
            <div className="form-group"><label className="label">Amount Min</label><input className="input" type="number" step="0.01" value={searchForm.amount_min} onChange={e=>setSearchForm({...searchForm, amount_min: e.target.value})} /></div>
            <div className="form-group"><label className="label">Amount Max</label><input className="input" type="number" step="0.01" value={searchForm.amount_max} onChange={e=>setSearchForm({...searchForm, amount_max: e.target.value})} /></div>
            <button className="button" type="submit">Search</button>
          </form>

          <div>
            <h3>Search Results</h3>
            {searchResults.length === 0 && <div>No results</div>}
            {searchResults.map((x) => (
              <div key={x._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>
                  {new Date(x.date).toLocaleDateString()} · {searchForm.scope === 'expense' ? (x.category || '-') : (x.source || '-')} · ₹{x.amount}
                </span>
                <div>
                  {searchForm.scope === 'expense' ? (
                    <button className="button" onClick={() => { setTab('expense'); setEditingExpenseId(x._id); setExpenseForm({ date: x.date ? new Date(x.date).toISOString().slice(0,10) : '', category: x.category || '', amount: x.amount != null ? String(x.amount) : '', payment_method: x.payment_method || 'UPI', description: x.description || '', group_id: x.group_id || '', split_equal: Boolean(x.split_equal) }); }}>Edit</button>
                  ) : (
                    <button className="button" onClick={() => { setTab('income'); setEditingIncomeId(x._id); setIncomeForm({ date: x.date ? new Date(x.date).toISOString().slice(0,10) : '', amount: x.amount != null ? String(x.amount) : '', source: x.source || 'Salary', payment_method: x.payment_method || 'Bank Transfer', notes: x.notes || '', group_id: x.group_id || '' }); }}>Edit</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {message && <div className={message.startsWith('Success') ? 'success' : 'error'} style={{ marginTop: 12 }}>{message}</div>}

      <div style={{ marginTop: 20 }}>
        <h3>Recent Expenses</h3>
        {recentExpenses.length === 0 && <div>No expenses yet.</div>}
        {recentExpenses.map((x) => (
          <div key={x._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>{new Date(x.date).toLocaleDateString()} · {x.category} · ₹{x.amount}</span>
            <div>
              <button
                className="button"
                style={{ marginRight: 8 }}
                onClick={() => {
                  setTab('expense');
                  setEditingExpenseId(x._id);
                  setExpenseForm({
                    date: x.date ? new Date(x.date).toISOString().slice(0,10) : '',
                    category: x.category || '',
                    amount: x.amount != null ? String(x.amount) : '',
                    payment_method: x.payment_method || 'UPI',
                    description: x.description || '',
                    group_id: x.group_id || '',
                    split_equal: Boolean(x.split_equal)
                  });
                }}
              >Edit</button>
              <button className="button" onClick={() => deleteExpense(x._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Recent Income</h3>
        {recentIncome.length === 0 && <div>No income yet.</div>}
        {recentIncome.map((x) => (
          <div key={x._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>{new Date(x.date).toLocaleDateString()} · {x.source} · ₹{x.amount}</span>
            <div>
              <button
                className="button"
                style={{ marginRight: 8 }}
                onClick={() => {
                  setTab('income');
                  setEditingIncomeId(x._id);
                  setIncomeForm({
                    date: x.date ? new Date(x.date).toISOString().slice(0,10) : '',
                    amount: x.amount != null ? String(x.amount) : '',
                    source: x.source || 'Salary',
                    payment_method: x.payment_method || 'Bank Transfer',
                    notes: x.notes || '',
                    group_id: x.group_id || ''
                  });
                }}
              >Edit</button>
              <button className="button" onClick={() => deleteIncome(x._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadData;
/*
import React, { useEffect, useState } from 'react';
import { expenseAPI, incomeAPI, uploadAPI } from '../config/api';

function UploadData() {
  const [tab, setTab] = useState('upload'); // upload | expense | income | search
  const [type, setType] = useState('expense');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    date: '', category: '', amount: '', payment_method: 'UPI', description: '', group_id: '', split_equal: false
  });
  const [incomeForm, setIncomeForm] = useState({
    date: '', amount: '', source: 'Salary', payment_method: 'Bank Transfer', notes: '', group_id: ''
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentIncome, setRecentIncome] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [searchForm, setSearchForm] = useState({
    scope: 'expense',
    q: '',
    category: '',
    source: '',
    payment_method: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
  });
  const [searchResults, setSearchResults] = useState([]);

  const paymentMethods = [
    "UPI",
    "Cash",
    "Card",
    "Credit Card",
    "Debit Card",
    "NetBanking",
    "Bank Transfer"
  ];

  async function fetchRecent() {
    try {
      const [eRes, iRes] = await Promise.all([
        expenseAPI.getAll(),
        incomeAPI.getAll()
      ]);
      setRecentExpenses(eRes.data || []);
      setRecentIncome(iRes.data || []);
    } catch (error) {
      console.error('Error fetching recent data:', error);
      setRecentExpenses([]);
      setRecentIncome([]);
    }
  }

  useEffect(() => { fetchRecent(); }, []);

  async function runSearch(e) {
    if (e) e.preventDefault();
    setMessage('');
    const s = searchForm;
    const params = {};
    
    if (s.q) params.q = s.q;
    if (s.payment_method) params.payment_method = s.payment_method;
    if (s.date_from) params.date_from = s.date_from;
    if (s.date_to) params.date_to = s.date_to;
    if (s.amount_min) params.amount_min = s.amount_min;
    if (s.amount_max) params.amount_max = s.amount_max;
    if (s.scope === 'expense' && s.category) params.category = s.category;
    if (s.scope === 'income' && s.source) params.source = s.source;

    try {
      const response = s.scope === 'expense' 
        ? await expenseAPI.search(params)
        : await incomeAPI.search(params);

      const list = Array.isArray(response.data) ? response.data : [];
      setSearchResults(list);
      if (list.length === 0) setMessage('No results');
    } catch (err) {
      const errText = String(err.response?.data?.message || err.message || err).slice(0, 300);
      setMessage(`Error: ${errText}`);
      setSearchResults([]);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setMessage('');
    if (!file) return setMessage('Please choose a CSV or PDF file');

    setLoading(true);
    try {
      const response = await uploadAPI.uploadFile(file, type);
      const inserted = response.data?.inserted;
      setMessage(`Success${inserted != null ? `: inserted ${inserted} records` : ''}`);
      fetchRecent();
    } catch (err) {
      const errText = String(err.response?.data?.message || err.message || err).slice(0, 300);
      setMessage(`Error: ${errText}`);
    } finally {
      setLoading(false);
    }
  }

  async function createExpense(e) {
    e.preventDefault();
    setMessage('');
    try {
      const isEditing = Boolean(editingExpenseId);
      
      if (isEditing) {
        await expenseAPI.update(editingExpenseId, expenseForm);
      } else {
        await expenseAPI.create(expenseForm);
      }
      
      setExpenseForm({ date: '', category: '', amount: '', payment_method: 'UPI', description: '', group_id: '', split_equal: false });
      setEditingExpenseId(null);
      setMessage(isEditing ? 'Success: expense updated' : 'Success: expense added');
      fetchRecent();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  }

  async function createIncome(e) {
    e.preventDefault();
    setMessage('');
    try {
      const isEditing = Boolean(editingIncomeId);
      
      if (isEditing) {
        await incomeAPI.update(editingIncomeId, incomeForm);
      } else {
        await incomeAPI.create(incomeForm);
      }
      
      setIncomeForm({ date: '', amount: '', source: 'Salary', payment_method: 'Bank Transfer', notes: '', group_id: '' });
      setEditingIncomeId(null);
      setMessage(isEditing ? 'Success: income updated' : 'Success: income added');
      fetchRecent();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  }

  async function deleteExpense(id) {
    try {
      await expenseAPI.delete(id);
      fetchRecent();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }

  async function deleteIncome(id) {
    try {
      await incomeAPI.delete(id);
      fetchRecent();
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  }

  return (
    <div className="card">
      <div className="page-title">Data Management</div>
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className="button" onClick={() => setTab('upload')} style={{ marginRight: 8, background: tab==='upload' ? '#2563eb' : '#6b7280' }}>Upload CSV/PDF</button>
        <button className="button" onClick={() => setTab('expense')} style={{ marginRight: 8, background: tab==='expense' ? '#2563eb' : '#6b7280' }}>Add Expense</button>
        <button className="button" onClick={() => setTab('income')} style={{ marginRight: 8, background: tab==='income' ? '#2563eb' : '#6b7280' }}>Add Income</button>
        <button className="button" onClick={() => setTab('search')} style={{ background: tab==='search' ? '#2563eb' : '#6b7280' }}>Search</button>
      </div>

      {tab === 'upload' && (
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="select" style={{ marginLeft: 8 }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <input className="input" type="file" accept=".csv,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" disabled={loading} className="button">{loading ? 'Uploading…' : 'Upload'}</button>
        </form>
      )}

      {tab === 'expense' && (
        <form onSubmit={createExpense}>
          <div className="form-group"><label className="label">Date</label><input className="input" type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Category</label><input className="input" value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm, category:e.target.value})} placeholder="Food, Rent, Utilities" required /></div>
          <div className="form-group"><label className="label">Amount</label><input className="input" type="number" step="0.01" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount:e.target.value})} required /></div>

        
          <div className="form-group">
            <label className="label">Payment Method</label>
            <select
              className="select"
              value={expenseForm.payment_method}
              onChange={e => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
              required
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group"><label className="label">Description</label><input className="input" value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm, description:e.target.value})} placeholder="Optional" /></div>
          <div className="form-group"><label className="label">Group Id (optional)</label><input className="input" value={expenseForm.group_id} onChange={e=>setExpenseForm({...expenseForm, group_id:e.target.value})} /></div>
          <div className="form-group"><label className="label"><input type="checkbox" checked={expenseForm.split_equal} onChange={e=>setExpenseForm({...expenseForm, split_equal:e.target.checked})} /> Split equally among group</label></div>
          <button className="button" type="submit">Add Expense</button>
        </form>
      )}

      {tab === 'income' && (
        <form onSubmit={createIncome}>
          <div className="form-group"><label className="label">Date</label><input className="input" type="date" value={incomeForm.date} onChange={e=>setIncomeForm({...incomeForm, date:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Amount</label><input className="input" type="number" step="0.01" value={incomeForm.amount} onChange={e=>setIncomeForm({...incomeForm, amount:e.target.value})} required /></div>
          <div className="form-group"><label className="label">Source</label><input className="input" value={incomeForm.source} onChange={e=>setIncomeForm({...incomeForm, source:e.target.value})} placeholder="Salary, Business, Freelance" required /></div>

            <div className="form-group">
            <label className="label">Payment Method</label>
            <select
              className="select"
              value={incomeForm.payment_method}
              onChange={e => setIncomeForm({ ...incomeForm, payment_method: e.target.value })}
              required
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group"><label className="label">Notes</label><input className="input" value={incomeForm.notes} onChange={e=>setIncomeForm({...incomeForm, notes:e.target.value})} placeholder="Optional" /></div>
          <div className="form-group"><label className="label">Group Id (optional)</label><input className="input" value={incomeForm.group_id} onChange={e=>setIncomeForm({...incomeForm, group_id:e.target.value})} /></div>
          <button className="button" type="submit">Add Income</button>
        </form>
      )}

      
    </div>
  );
}
*/
//export default UploadData;

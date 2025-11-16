import React, { useEffect, useState } from 'react';
import api from '../config/api';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [prefs, setPrefs] = useState({
    timezone: 'UTC',
    bills: {
      electricity: { enabled: false, dayOfMonth: 1 },
      rent: { enabled: false, dayOfMonth: 1 },
      subscriptions: { enabled: false, dayOfMonth: 1 },
    },
    budgets: {
      monthlyBudget: 0,
      lowBalanceThresholdPct: 20,
    },
    groupAlerts: {
      notifyMembershipChanges: true,
      notifyGroupTransactions: false,
    },
    smartReminders: {
      enabled: false,
      groceryHintAmount: 2000,
    },
  });
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState(null);
  const [newReminder, setNewReminder] = useState({ message: '', sendAt: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [p, h, s] = await Promise.all([
          api.get('/notifications/preferences'),
          api.get('/notifications/reminders?includeSent=false'),
          api.get('/notifications/stats'),
        ]);
        const d = p.data || {};
        setPrefs({
          timezone: d.timezone || 'UTC',
          bills: {
            electricity: {
              enabled: Boolean(d?.bills?.electricity?.enabled ?? false),
              dayOfMonth: Number(d?.bills?.electricity?.dayOfMonth ?? 1),
            },
            rent: {
              enabled: Boolean(d?.bills?.rent?.enabled ?? false),
              dayOfMonth: Number(d?.bills?.rent?.dayOfMonth ?? 1),
            },
            subscriptions: {
              enabled: Boolean(d?.bills?.subscriptions?.enabled ?? false),
              dayOfMonth: Number(d?.bills?.subscriptions?.dayOfMonth ?? 1),
            },
          },
          budgets: {
            monthlyBudget: Number(d?.budgets?.monthlyBudget ?? 0),
            lowBalanceThresholdPct: Number(d?.budgets?.lowBalanceThresholdPct ?? 20),
          },
          groupAlerts: {
            notifyMembershipChanges: Boolean(d?.groupAlerts?.notifyMembershipChanges ?? true),
            notifyGroupTransactions: Boolean(d?.groupAlerts?.notifyGroupTransactions ?? false),
          },
          smartReminders: {
            enabled: Boolean(d?.smartReminders?.enabled ?? false),
            groceryHintAmount: Number(d?.smartReminders?.groceryHintAmount ?? 2000),
          },
        });
        setHistory(h.data || []);
        setStats(s.data || null);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/notifications/preferences', prefs);
      setMessage('Preferences saved');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const createReminder = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (!newReminder.message || !newReminder.sendAt) {
        setMessage('Enter message and date/time');
        return;
      }
      await api.post('/notifications/reminders', newReminder);
      const { data } = await api.get('/notifications/reminders?includeSent=false');
      setHistory(data || []);
      setNewReminder({ message: '', sendAt: '' });
      setMessage('Reminder created');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to create reminder');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading preferences...</div>;

  return (
    <div className="form-container">
      <h2>Notification & Reminder Settings (In-App)</h2>
      <form onSubmit={save} className="form">
        <fieldset style={{ border: '1px solid #eee', padding: 12, marginBottom: 16 }}>
          <legend>Preferences</legend>
          <div className="form-group">
            <label>Time Zone</label>
            <input
              type="text"
              placeholder="UTC"
              value={prefs.timezone}
              onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
            />
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #eee', padding: 12, marginBottom: 16 }}>
          <legend id="notify">Customizable Bill Reminders</legend>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={prefs.bills.electricity.enabled}
                onChange={(e) => setPrefs({ ...prefs, bills: { ...prefs.bills, electricity: { ...prefs.bills.electricity, enabled: e.target.checked } } })}
              /> Electricity
            </label>
            <input type="number" min={1} max={31} style={{ marginLeft: 8, width: 80 }} value={prefs.bills.electricity.dayOfMonth}
              onChange={(e) => setPrefs({ ...prefs, bills: { ...prefs.bills, electricity: { ...prefs.bills.electricity, dayOfMonth: Number(e.target.value) } } })}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={prefs.bills.rent.enabled}
                onChange={(e) => setPrefs({ ...prefs, bills: { ...prefs.bills, rent: { ...prefs.bills.rent, enabled: e.target.checked } } })}
              /> Rent
            </label>
            <input type="number" min={1} max={31} style={{ marginLeft: 8, width: 80 }} value={prefs.bills.rent.dayOfMonth}
              onChange={(e) => setPrefs({ ...prefs, bills: { ...prefs.bills, rent: { ...prefs.bills.rent, dayOfMonth: Number(e.target.value) } } })}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={prefs.bills.subscriptions.enabled}
                onChange={(e) => setPrefs({ ...prefs, bills: { ...prefs.bills, subscriptions: { ...prefs.bills.subscriptions, enabled: e.target.checked } } })}
              /> Subscriptions
            </label>
            <input type="number" min={1} max={31} style={{ marginLeft: 8, width: 80 }} value={prefs.bills.subscriptions.dayOfMonth}
              onChange={(e) => setPrefs({ ...prefs, bills: { ...prefs.bills, subscriptions: { ...prefs.bills.subscriptions, dayOfMonth: Number(e.target.value) } } })}
            />
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #eee', padding: 12, marginBottom: 16 }}>
          <legend>Budget & Low Balance Alerts</legend>
          <div className="form-group">
            <label>Monthly Budget (₹)</label>
            <input type="number" min={0} value={prefs.budgets.monthlyBudget}
              onChange={(e) => setPrefs({ ...prefs, budgets: { ...prefs.budgets, monthlyBudget: Number(e.target.value) } })}
            />
          </div>
          <div className="form-group">
            <label>Low Balance Threshold (%)</label>
            <input type="number" min={0} max={100} value={prefs.budgets.lowBalanceThresholdPct}
              onChange={(e) => setPrefs({ ...prefs, budgets: { ...prefs.budgets, lowBalanceThresholdPct: Number(e.target.value) } })}
            />
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #eee', padding: 12, marginBottom: 16 }}>
          <legend>Group Alerts</legend>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={prefs.groupAlerts.notifyMembershipChanges}
                onChange={(e) => setPrefs({ ...prefs, groupAlerts: { ...prefs.groupAlerts, notifyMembershipChanges: e.target.checked } })}
              /> Notify when added/removed from a group
            </label>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={prefs.groupAlerts.notifyGroupTransactions}
                onChange={(e) => setPrefs({ ...prefs, groupAlerts: { ...prefs.groupAlerts, notifyGroupTransactions: e.target.checked } })}
              /> Notify on group transactions
            </label>
          </div>
        </fieldset>

        <fieldset style={{ border: '1px solid #eee', padding: 12, marginBottom: 16 }}>
          <legend>Smart Reminders</legend>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={prefs.smartReminders.enabled}
                onChange={(e) => setPrefs({ ...prefs, smartReminders: { ...prefs.smartReminders, enabled: e.target.checked } })}
              /> Enable smart expense reminders
            </label>
          </div>
          <div className="form-group">
            <label>Grocery hint amount (₹)</label>
            <input type="number" min={0} value={prefs.smartReminders.groceryHintAmount}
              onChange={(e) => setPrefs({ ...prefs, smartReminders: { ...prefs.smartReminders, groceryHintAmount: Number(e.target.value) } })}
            />
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
      {message && (
        <div style={{ marginTop: 12 }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 id="create">Create Reminder</h3>
        <form onSubmit={createReminder} className="form" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>Message</label>
            <input type="text" value={newReminder.message} onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Send At</label>
            <input type="datetime-local" value={newReminder.sendAt} onChange={(e) => setNewReminder({ ...newReminder, sendAt: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-secondary">Add Reminder</button>
          </div>
        </form>

        <h3>Create Notification</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setMessage(null);
          try {
            if (!newReminder.message) { setMessage('Enter message'); return; }
            await api.post('/notifications/reminders', { message: newReminder.message, sendAt: new Date().toISOString() });
            const { data } = await api.get('/notifications/reminders?includeSent=false');
            setHistory(data || []);
            setNewReminder({ message: '', sendAt: '' });
            setMessage('Notification created');
          } catch (e) {
            setMessage(e.response?.data?.message || 'Failed to create notification');
          }
        }} className="form" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>Message</label>
            <input type="text" value={newReminder.message} onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-secondary">Add Notification</button>
          </div>
        </form>

        <h3 id="reminders">Pending Reminders</h3>
        {history?.length === 0 && <div>No notifications yet.</div>}
        {history?.length > 0 && (
          <ul>
            {history.map(h => (
              <li key={h._id}>
                <span>{new Date(h.sendAt || h.createdAt).toLocaleString()} — </span>
                <span>{h.message}</span>
                {h.sent ? <span style={{ color: 'green' }}> (sent)</span> : <span style={{ color: '#92400e' }}> (pending)</span>}
                {h.error && <span style={{ color: 'red' }}> — {h.error}</span>}
              </li>
            ))}
          </ul>
        )}

        <h3 style={{ marginTop: 16 }}>Reports</h3>
        {stats ? (
          <div>
            <div>Reminder effectiveness: {stats.effectiveness}% ({stats.onTime}/{stats.total})</div>
            <div style={{ marginTop: 8 }}>
              <b>Monthly breakdown:</b>
              <ul>
                {Object.entries(stats.monthly || {}).map(([m, c]) => (
                  <li key={m}>{m}: {c}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div>No stats available.</div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;



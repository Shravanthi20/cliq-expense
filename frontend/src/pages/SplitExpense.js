import React, { useState, useEffect } from "react";
import api, { userAPI, expenseAPI } from "../config/api";
import { Pie } from "react-chartjs-2";
import { saveAs } from "file-saver";
import "chart.js/auto";

export default function SplitExpense() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [members, setMembers] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [category, setCategory] = useState("Shared");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [groupsRes, usersRes, expensesRes] = await Promise.all([
        api.get('/groups', { params: { mine: true } }),
        userAPI.getAll(),
        expenseAPI.getAll(),
      ]);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
      setExpenses(expensesRes.data);
      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroup && groups.length > 0 && users.length > 0) {
      const group = groups.find((g) => g._id === selectedGroup);
      if (group) {
        const totalShares = group.members.reduce((sum, m) => sum + m.share, 0);
        const defaultShares = group.members.map((m) => {
          const user = users.find((u) => u._id === m.user_id);
          return {
            user_id: m.user_id,
            name: user ? user.name : "Unknown User",
            share:
              splitType === "equal" ? 1 / group.members.length : m.share,
            amount:
              splitType === "equal"
                ? parseFloat(amount || 0) / group.members.length
                : parseFloat(amount || 0) * (m.share / totalShares),
          };
        });
        setMembers(defaultShares);
      }
    } else {
      setMembers([]);
    }
  }, [selectedGroup, splitType, groups, users, amount]);

  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    const newShare = parseFloat(value) || 0;
    newMembers[index].share = newShare;

    const totalShares = newMembers.reduce((sum, m) => sum + m.share, 0);
    newMembers.forEach((m) => {
      m.amount =
        totalShares > 0
          ? parseFloat(amount || 0) * (m.share / totalShares)
          : 0;
    });

    setMembers(newMembers);
  };

  const validateForm = () => {
    if (!description.trim()) return setError("Please enter a description");
    if (!amount || parseFloat(amount) <= 0)
      return setError("Please enter a valid amount");
    if (!selectedGroup) return setError("Please select a group");
    if (!date) return setError("Please select a date");
    if (!category) return setError("Please select a category");
    if (!paymentMethod) return setError("Please select a payment method");
    if (splitType === "custom") {
      const totalShares = members.reduce((sum, m) => sum + m.share, 0);
      if (totalShares <= 0)
        return setError("Total shares must be greater than 0");
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      await expenseAPI.create({
        description: description.trim(),
        amount: parseFloat(amount),
        group_id: selectedGroup,
        date: new Date(date).toISOString(),
        category,
        payment_method: paymentMethod,
        split_between: members.map((m) => m.user_id),
        split_equal: splitType === 'equal',
      });

      alert("Expense Added Successfully!");
      setDescription("");
      setAmount("");
      setSelectedGroup("");
      setMembers([]);
      setSplitType("equal");
      setCategory("Shared");
      setPaymentMethod("UPI");
      setDate(new Date().toISOString().slice(0,10));
      fetchAllData();
    } catch (err) {
      console.error("Error adding expense:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to add expense.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () =>
    members.reduce((sum, m) => sum + m.amount, 0);

  const downloadCSV = () => {
    if (expenses.length === 0) {
      alert("No expenses to download!");
      return;
    }
    const headers = ["Description", "Amount", "Group ID"];
    const rows = expenses.map((exp) => [
      exp.description,
      exp.amount,
      exp.group_id,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "expenses_report.csv");
  };

  // 🧠 Derive member split for selected expense
  const getSplitData = (expense) => {
    const group = groups.find((g) => g._id === expense.group_id);
    if (!group || group.members.length === 0) return null;

    const perMember = expense.amount / group.members.length;
    const groupMembers = group.members.map((m) => {
      const user = users.find((u) => u._id === m.user_id);
      return {
        name: user ? user.name : "Unknown User",
        amount: perMember,
      };
    });

    return groupMembers;
  };

  if (loading && groups.length === 0) return <div>Loading data...</div>;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h2>Split Expense</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Create Expense */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Description *</label>
          <input
            type="text"
            value={description}
            placeholder="Dinner with friends"
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <label>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="Shared">Shared</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="NetBanking">NetBanking</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Amount (₹) *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Select Group *</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Choose a group...</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Split Type</label>
          <div style={{ marginTop: "5px" }}>
            <label style={{ marginRight: "10px" }}>
              <input
                type="radio"
                name="splitType"
                value="equal"
                checked={splitType === 'equal'}
                onChange={() => setSplitType('equal')}
              /> Equal Split
            </label>
            <label>
              <input
                type="radio"
                name="splitType"
                value="custom"
                checked={splitType === 'custom'}
                onChange={() => setSplitType('custom')}
              /> Custom Split
            </label>
          </div>
        </div>

        {splitType === 'custom' && members.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <h4>Custom Shares</h4>
            {members.map((m, idx) => (
              <div key={m.user_id} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>{m.name}</div>
                <input
                  type="number"
                  step="0.01"
                  value={m.share}
                  onChange={(e) => handleMemberChange(idx, e.target.value)}
                  style={{ width: "120px", padding: "6px" }}
                />
                <div style={{ width: 120, textAlign: 'right' }}>₹{m.amount.toFixed(2)}</div>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              Total: ₹{calculateTotal().toFixed(2)}
            </div>
          </div>
        )}

        <button
          type="submit"
          style={{
            background: "#2196F3",
            color: "white",
            padding: "10px 15px",
            border: "none",
            marginTop: "10px",
          }}
        >
          Add Expense
        </button>
      </form>

      {/* Existing Split Expenses */}
      <h3 style={{ marginTop: "30px" }}>Existing Expenses</h3>
      <input
        type="text"
        placeholder="Search expenses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
      />

      <button
        onClick={downloadCSV}
        style={{
          background: "#4CAF50",
          color: "white",
          padding: "8px",
          border: "none",
          marginBottom: "15px",
        }}
      >
        Download Report (CSV)
      </button>

      {expenses.filter((e) => e.group_id).length === 0 ? (
        <p>No split expenses recorded yet.</p>
      ) : (
        <ul>
          {expenses
            .filter((exp) => exp.group_id)
            .filter((exp) =>
              exp.description
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .slice(0, search ? expenses.length : 3)
            .map((exp) => (
              <li key={exp._id} style={{ marginBottom: "8px" }}>
                <strong
                  onClick={() => setSelectedExpense(exp)}
                  style={{
                    cursor: "pointer",
                    color: "#2196F3",
                  }}
                >
                  {exp.description}
                </strong>{" "}
                - ₹{exp.amount}
              </li>
            ))}
        </ul>
      )}

      {/* 🥧 Pie Chart Modal */}
      {selectedExpense && (
        <div
          onClick={() => setSelectedExpense(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h3>{selectedExpense.description}</h3>

            {/* 🧮 Compute from group if missing */}
            {getSplitData(selectedExpense) ? (
              <Pie
                data={{
                  labels: getSplitData(selectedExpense).map(
                    (m) =>
                      `${m.name} (${(
                        (m.amount / selectedExpense.amount) *
                        100
                      ).toFixed(1)}%)`
                  ),
                  datasets: [
                    {
                      data: getSplitData(selectedExpense).map(
                        (m) => m.amount
                      ),
                      backgroundColor: [
                        "#36A2EB",
                        "#FF6384",
                        "#FFCE56",
                        "#4BC0C0",
                        "#9966FF",
                        "#FF9F40",
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                    title: {
                      display: true,
                      text: "Expense Split by Members (%)",
                    },
                  },
                }}
              />
            ) : (
              <p>No members found for this group.</p>
            )}

            <button
              onClick={() => setSelectedExpense(null)}
              style={{
                marginTop: "10px",
                background: "#2196F3",
                color: "white",
                border: "none",
                padding: "8px 12px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



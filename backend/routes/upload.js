const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");
const Income = require("../models/Income");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function parseCsv(buffer) {
  try {
    const text = buffer.toString("utf8");
    return parse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    throw new Error("Invalid CSV format");
  }
}

async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  const lines = data.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const headerIdx = lines.findIndex((l) => /date/i.test(l) && /amount/i.test(l));
  if (headerIdx === -1) return [];
  const header = lines[headerIdx].split(/\s*[;,|]\s*|\s{2,}/);
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(/\s*[;,|]\s*|\s{2,}/);
    if (cols.length < 2) continue;
    const row = {};
    header.forEach((h, idx) => (row[h.toLowerCase()] = cols[idx]));
    rows.push(row);
  }
  return rows;
}

function normalizePaymentMethod(value) {
  if (!value) return undefined;
  const v = String(value).toLowerCase();
  if (v.includes("credit")) return "Credit Card";
  if (v.includes("debit")) return "Debit Card";
  if (v.includes("upi")) return "UPI";
  if (v.includes("cash")) return "Cash";
  if (v.includes("netbank") || v.includes("net bank")) return "NetBanking";
  if (v.includes("bank") || v.includes("transfer")) return "Bank Transfer";
  if (v.includes("card")) return "Card";
  return undefined;
}

const allowedIncomeMethods = new Set(["Bank Transfer", "UPI", "Cash"]);
function normalizeIncomeMethod(value) {
  const m = normalizePaymentMethod(value) || "Bank Transfer";
  return allowedIncomeMethods.has(m) ? m : "Bank Transfer";
}

const allowedIncomeSources = new Set(["Salary", "Business", "Freelance"]);
function normalizeIncomeSource(value) {
  if (!value) return "Salary";
  const v = String(value).trim();
  return allowedIncomeSources.has(v) ? v : "Salary";
}

function toObjectIdOrNull(id) {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const { type } = req.query; // 'expense' or 'income'
    if (!type || !["expense", "income"].includes(type)) {
      return res.status(400).json({ message: "Missing or invalid type (expense|income)" });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const isCsv = /text\/csv|application\/vnd.ms-excel/.test(req.file.mimetype) || req.file.originalname.endsWith(".csv");
    const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname.endsWith(".pdf");

    let rows = [];
    if (isCsv) {
      rows = parseCsv(req.file.buffer);
    } else if (isPdf) {
      rows = await parsePdf(req.file.buffer);
    } else {
      return res.status(400).json({ message: "Unsupported file type. Upload CSV or PDF." });
    }

    const userId = req.user.id;
    const docs = [];

    if (type === "expense") {
      for (const r of rows) {
        const payment = normalizePaymentMethod(r.payment_method);
        const doc = {
          user_id: userId,
          group_id: toObjectIdOrNull(r.group_id),
          date: r.date ? new Date(r.date) : undefined,
          category: r.category,
          amount: r.amount != null ? Number(r.amount) : undefined,
          payment_method: payment || "Card",
          description: r.description || "",
          source: isCsv ? "csv" : "pdf",
        };
        if (!doc.date || Number.isNaN(doc.amount) || !doc.category) continue;
        docs.push(doc);
      }
      if (docs.length === 0) return res.status(400).json({ message: "No valid expense rows found" });
      await Expense.insertMany(docs, { ordered: false });
    } else {
      for (const r of rows) {
        const doc = {
          user_id: userId,
          group_id: toObjectIdOrNull(r.group_id),
          date: r.date ? new Date(r.date) : undefined,
          amount: r.amount != null ? Number(r.amount) : undefined,
          source: normalizeIncomeSource(r.source),
          payment_method: normalizeIncomeMethod(r.payment_method),
          notes: r.notes || "",
        };
        if (!doc.date || Number.isNaN(doc.amount)) continue;
        docs.push(doc);
      }
      if (docs.length === 0) return res.status(400).json({ message: "No valid income rows found" });
      await Income.insertMany(docs, { ordered: false });
    }

    return res.json({ message: "Uploaded successfully", inserted: docs.length });
  } catch (err) {
    const details = err?.errors ? Object.values(err.errors).map(e => e.message).join(", ") : err.message;
    return res.status(500).json({ message: "Server error", error: details });
  }
});

module.exports = router;

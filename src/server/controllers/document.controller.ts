import { Request, Response, NextFunction } from "express";
import db from "../db";

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  const { text, title, aiData, userId = "default_user" } = req.body;

  try {
    if (!aiData) {
      return res.status(400).json({ error: "Missing processed AI data" });
    }

    const data = aiData;
    const docId = Math.random().toString(36).substring(7);

    db.prepare(`
      INSERT INTO documents (id, user_id, title, category, purpose, original_text, overall_risk_score, complexity_score, fairness_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(docId, userId, title, data.overall.category, data.overall.purpose, text, data.overall.riskScore, data.overall.complexityScore, data.overall.fairnessIndex);

    const insertClause = db.prepare(`
      INSERT INTO clauses (id, document_id, clause_title, clause_text, simplified_text, importance_score, risk_level, complexity_score, financial_risk, legal_risk, operational_risk, orbit_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const clause of data.clauses) {
      const clauseId = Math.random().toString(36).substring(7);
      let orbit = clause.importance > 75 ? "Inner" : clause.importance > 40 ? "Middle" : "Outer";
      insertClause.run(
        clauseId, docId, clause.title, clause.text, clause.simplified,
        clause.importance, clause.riskLevel, clause.complexity,
        clause.financialRisk, clause.legalRisk, clause.operationalRisk, orbit
      );
    }

    res.json({ status: "success", document_id: docId });
  } catch (error) {
    next(error);
  }
};

export const getDocument = (req: Request, res: Response) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  const clauses = db.prepare("SELECT * FROM clauses WHERE document_id = ?").all(req.params.id);
  res.json({ document: doc, clauses });
};

export const getAllDocuments = (req: Request, res: Response) => {
  const docs = db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all();
  res.json(docs);
};

export interface Document {
  id: string;
  userId: string;
  title: string;
  category: string;
  purpose: string;
  overall_risk_score: number;
  complexity_score: number;
  fairness_index: number;
  created_at: string;
}

export interface Clause {
  id: string;
  documentId: string;
  clause_title: string;
  clause_text: string;
  simplified_text: string;
  category: string;
  importance_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  complexity: number;
  financial_risk: number;
  legal_risk: number;
  operational_risk: number;
}

export interface DocumentData {
  document: Document;
  clauses: Clause[];
}

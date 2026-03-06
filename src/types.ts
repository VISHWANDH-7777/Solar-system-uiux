export interface Document {
  id: string;
  user_id: string;
  title: string;
  category: string;
  purpose: string;
  original_text: string;
  overall_risk_score: number;
  complexity_score: number;
  fairness_index: number;
  created_at: string;
}

export interface Clause {
  id: string;
  document_id: string;
  clause_title: string;
  clause_text: string;
  simplified_text: string;
  importance_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  complexity_score: number;
  financial_risk: number;
  legal_risk: number;
  operational_risk: number;
  orbit_level: 'Inner' | 'Middle' | 'Outer';
}

export interface DocumentData {
  document: Document;
  clauses: Clause[];
}

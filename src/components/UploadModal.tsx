import React, { useState } from 'react';
import { 
  X, 
  Download 
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as pdfjsLib from 'pdfjs-dist';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const UploadModal = ({ 
  isOpen, 
  onClose, 
  onProcessed, 
  user, 
  highThinking,
  processDocumentWithAI,
  handleFirestoreError,
  OperationType
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onProcessed: (id: string) => void, 
  user: User, 
  highThinking: boolean,
  processDocumentWithAI: (title: string, text: string, highThinking: boolean) => Promise<any>,
  handleFirestoreError: (error: any, op: any, path: string) => void,
  OperationType: any
}) => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setProcessing(true);
    try {
      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload .txt or .pdf');
      }

      setText(extractedText);
      if (!title) setTitle(file.name.split('.')[0]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!text || !title) return;
    setProcessing(true);
    try {
      // 1. Process with AI
      const aiData = await processDocumentWithAI(title, text, highThinking);

      // 2. Save to Firestore
      let docRef;
      try {
        docRef = await addDoc(collection(db, 'documents'), {
          userId: user.uid,
          title,
          purpose: aiData.overall.purpose,
          category: aiData.overall.category,
          overall_risk_score: aiData.overall.riskScore,
          complexity_score: aiData.overall.complexityScore,
          fairness_index: aiData.overall.fairnessIndex,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'documents');
        return;
      }

      // 3. Save Clauses
      const clausesPromises = aiData.clauses.map(async (clause: any) => {
        try {
          return await addDoc(collection(db, `documents/${docRef.id}/clauses`), {
            documentId: docRef.id,
            clause_title: clause.title,
            clause_text: clause.text,
            simplified_text: clause.simplified,
            category: clause.category,
            importance_score: clause.importance,
            risk_level: clause.riskLevel,
            complexity: clause.complexity,
            financial_risk: clause.financialRisk,
            legal_risk: clause.legalRisk,
            operational_risk: clause.operationalRisk
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `documents/${docRef.id}/clauses`);
        }
      });

      await Promise.all(clausesPromises);
      
      onProcessed(docRef.id);
      onClose();
    } catch (err) {
      console.error('Processing error:', err);
      alert(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass w-full max-w-2xl rounded-3xl p-8 relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-100">Process New Document</h2>
          <button onClick={onClose} className="p-2 hover:bg-primary/10 rounded-full">
            <X size={24} className="text-primary" />
          </button>
        </div>

        <div className="space-y-6">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              handleFileUpload(file);
            }}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
              isDragging ? "border-primary bg-primary/10" : "border-primary/20 hover:border-primary/40"
            )}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              id="fileInput"
              type="file" 
              className="hidden" 
              accept=".txt,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <Download size={40} className="text-primary mx-auto mb-4" />
            <p className="text-slate-100 font-bold">Drop your legal document here</p>
            <p className="text-slate-400 text-xs mt-1">Supports .pdf and .txt files</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-primary/10"></div>
            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">or paste text</span>
            <div className="h-px flex-1 bg-primary/10"></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary/60 uppercase tracking-widest mb-2">Document Title</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface/50 border border-primary/20 rounded-xl px-4 py-3 text-slate-100 focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="e.g. Project Hyperion MSA"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-primary/60 uppercase tracking-widest mb-2">Legal Text</label>
            <textarea 
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full bg-surface/50 border border-primary/20 rounded-xl px-4 py-3 text-slate-100 h-48 focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Paste your legal document text here..."
            />
          </div>

          <button 
            onClick={handleProcess}
            disabled={processing || !text || !title}
            className="w-full bg-primary text-background-dark py-4 rounded-xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {processing ? 'Analyzing Solar Data...' : 'Launch AI Simplifier'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

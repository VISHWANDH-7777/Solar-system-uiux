import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { 
  Orbit, 
  Search, 
  Bell as Notifications, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  BarChart3 as Analytics, 
  FileText, 
  Library, 
  Download, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Network as Hub, 
  Scale, 
  Layers as Segment,
  PieChart as PieChartIcon,
  Grid as GridView,
  Activity as Waves,
  Clock as Timeline,
  Plus,
  X,
  Sun,
  Moon,
  ChevronRight,
  Info,
  LogOut,
  LogIn,
  BrainCircuit,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentData, Clause, Document } from './types';

// Firebase Imports
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  getDoc,
  getDocs,
  Timestamp,
  setDoc,
  getDocFromCache,
  getDocFromServer
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { SolarSystemEngine } from './components/SolarSystemEngine';
import { ClauseUniverse } from './components/ClauseUniverse';
import { Settings as SettingsView } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DocumentVault } from './components/DocumentVault';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Gemini AI Configuration ---
const getAIClient = () => {
  const apiKey = (window as any).process?.env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

const processDocumentWithAI = async (title: string, text: string, highThinking: boolean = false) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: highThinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
    contents: `Analyze this legal document and extract key clauses. For each clause, provide:
    - title: A short, descriptive title for the clause.
    - text: The original text of the clause.
    - simplified: A clear, plain-English explanation of what the clause means for a non-lawyer.
    - category: One of "Financial", "Legal", "Operational", "IP", or "Force Majeure".
    - importance: A score from 0-100 indicating how critical this clause is to the overall agreement.
    - riskLevel: One of "Low", "Medium", or "High".
    - complexity: A score from 0-100 indicating how difficult the legal language is.
    - financialRisk: A score from 0-100 indicating potential monetary impact.
    - legalRisk: A score from 0-100 indicating potential for litigation or legal penalties.
    - operationalRisk: A score from 0-100 indicating impact on day-to-day business operations.
    
    Also provide overall document metrics:
    - riskScore: Overall risk of the document (0-100).
    - complexityScore: Overall complexity (0-100).
    - fairnessIndex: How balanced the agreement is between parties (0-100).
    - purpose: A concise summary of the document's main goal.
    - category: The type of document (e.g., NDA, MSA, Employment Agreement).
    
    Document Title: ${title}
    Document Text: ${text}
    
    Return the response in JSON format.`,
    config: {
      thinkingConfig: highThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.NUMBER },
              complexityScore: { type: Type.NUMBER },
              fairnessIndex: { type: Type.NUMBER },
              purpose: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["riskScore", "complexityScore", "fairnessIndex", "purpose", "category"]
          },
          clauses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                text: { type: Type.STRING },
                simplified: { type: Type.STRING },
                category: { type: Type.STRING },
                importance: { type: Type.NUMBER },
                riskLevel: { type: Type.STRING },
                complexity: { type: Type.NUMBER },
                financialRisk: { type: Type.NUMBER },
                legalRisk: { type: Type.NUMBER },
                operationalRisk: { type: Type.NUMBER }
              },
              required: ["title", "text", "simplified", "category", "importance", "riskLevel", "complexity", "financialRisk", "legalRisk", "operationalRisk"]
            }
          }
        },
        required: ["overall", "clauses"]
      }
    }
  });

  if (!response.text) throw new Error("Empty AI response");
  return JSON.parse(response.text);
};

// --- Firebase Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark p-6">
          <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md w-full text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">System Anomaly Detected</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-background-dark py-3 rounded-xl font-bold hover:scale-[1.02] transition-all"
            >
              Re-initialize Orbit
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

testConnection();

// --- Components ---

const UploadModal = ({ isOpen, onClose, onProcessed, user, highThinking }: { isOpen: boolean, onClose: () => void, onProcessed: (id: string) => void, user: User, highThinking: boolean }) => {
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
      // 1. Process with AI on Frontend
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
        return; // Should not reach here as handleFirestoreError throws
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

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [highThinking, setHighThinking] = useState(false);

  const [user, loading, error] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Sync user profile to Firestore
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          if (data.highThinkingEnabled !== undefined && !currentDocId) {
             setHighThinking(data.highThinkingEnabled);
          }
          if (data.theme && (data.theme === 'dark') !== isDark) {
            setIsDark(data.theme === 'dark');
            document.documentElement.classList.toggle('dark', data.theme === 'dark');
          }
        } else {
          // Create new user profile if it doesn't exist
          const isDefaultAdmin = user.email === "vishwastar2005@gmail.com";
          setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            theme: isDark ? 'dark' : 'light',
            role: isDefaultAdmin ? 'admin' : 'client',
            highThinkingEnabled: highThinking,
            lastLogin: new Date().toISOString()
          }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      return () => unsubscribe();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Update highThinking in Firestore when it changes
  const handleSetHighThinking = async (val: boolean) => {
    setHighThinking(val);
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { highThinkingEnabled: val }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  useEffect(() => {
    if (user && currentDocId) {
      const docRef = doc(db, 'documents', currentDocId);
      const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const document = { id: docSnap.id, ...docSnap.data() } as Document;
          
          // Fetch clauses
          const clausesQuery = query(collection(db, `documents/${currentDocId}/clauses`));
          getDocs(clausesQuery).then(clauseSnaps => {
            const clauses = clauseSnaps.docs.map(c => ({ id: c.id, ...c.data() })) as Clause[];
            setDocData({ document, clauses });
          }).catch(error => {
            handleFirestoreError(error, OperationType.GET, `documents/${currentDocId}/clauses`);
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `documents/${currentDocId}`);
      });

      return () => unsubscribeDoc();
    } else {
      setDocData(null);
    }
  }, [user, currentDocId]);

  const toggleTheme = async () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, { theme: newTheme }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background-dark">
      <Orbit className="text-primary animate-spin" size={48} />
    </div>
  );

  if (!user) return <ErrorBoundary><Login /></ErrorBoundary>;

  return (
    <ErrorBoundary>
      <div className={cn("flex min-h-screen w-full", isDark ? "dark" : "")}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} userProfile={userProfile} />
        
        <div className="flex-1 flex flex-col min-h-screen">
          <Header 
            onToggleTheme={toggleTheme} 
            isDark={isDark} 
            highThinking={highThinking} 
            setHighThinking={handleSetHighThinking} 
          />
          
          <main className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 md:p-10 flex-1 overflow-y-auto"
                >
                  {docData ? (
                    <AnalyticsDashboard data={docData} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                      <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                        <Orbit size={40} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-100 mb-2">No Document Selected</h2>
                      <p className="text-slate-400 mb-8 max-w-md">Upload a legal document to begin your orbital analysis and simplification journey.</p>
                      <button 
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-primary text-background-dark px-8 py-3 rounded-xl font-black text-lg shadow-lg shadow-primary/20"
                      >
                        Process First Document
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'analysis' && docData && (
                <motion.div 
                  key="solar-analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  <SolarSystemEngine data={docData} />
                </motion.div>
              )}

              {activeTab === 'galaxy' && docData && (
                <motion.div 
                  key="clause-universe"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  <ClauseUniverse data={docData} />
                </motion.div>
              )}

              {activeTab === 'vault' && (
                <motion.div 
                  key="vault"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DocumentVault 
                    user={user} 
                    onSelect={(id) => {
                      setCurrentDocId(id);
                      setActiveTab('dashboard');
                    }} 
                    handleFirestoreError={handleFirestoreError}
                    OperationType={OperationType}
                  />
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 overflow-y-auto"
                >
                  <SettingsView 
                    user={user} 
                    userProfile={userProfile} 
                    isDark={isDark} 
                    toggleTheme={toggleTheme} 
                    highThinking={highThinking} 
                    setHighThinking={handleSetHighThinking} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <UploadModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          onProcessed={(id) => {
            setCurrentDocId(id);
            setActiveTab('dashboard');
          }}
          user={user}
          highThinking={highThinking}
        />

        {/* Floating Action Button */}
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="fixed bottom-8 right-8 size-14 bg-primary text-background-dark rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        {/* Map Toggle (Only show when doc selected) */}
        {docData && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-background-dark/80 backdrop-blur-xl border border-primary/30 rounded-full shadow-2xl z-[100]">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold transition-all",
                activeTab === 'dashboard' ? "bg-primary text-background-dark" : "text-primary/60 hover:text-primary"
              )}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold transition-all",
                activeTab === 'analysis' ? "bg-primary text-background-dark" : "text-primary/60 hover:text-primary"
              )}
            >
              Solar Map
            </button>
            <button 
              onClick={() => setActiveTab('galaxy')}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold transition-all",
                activeTab === 'galaxy' ? "bg-primary text-background-dark" : "text-primary/60 hover:text-primary"
              )}
            >
              Universe
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

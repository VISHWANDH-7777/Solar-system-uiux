import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Orbit, 
  Search, 
  Bell as Notifications, 
  Settings, 
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
  Info
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
  PolarRadiusAxis
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentData, Clause, Document } from './types';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { SolarSystemEngine } from './components/SolarSystemEngine';
import { ClauseUniverse } from './components/ClauseUniverse';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Gemini AI Configuration ---
const getAIClient = () => {
  const apiKey = (window as any).process?.env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

const processDocumentWithAI = async (title: string, text: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this legal document and extract key clauses. For each clause, provide:
    - title: A short, descriptive title for the clause.
    - text: The original text of the clause.
    - simplified: A clear, plain-English explanation of what the clause means for a non-lawyer.
    - category: One of "Financial", "Obligations", "Liability", "Termination", or "General".
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

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'analysis', label: 'Solar Analysis', icon: Analytics },
    { id: 'vault', label: 'Document Vault', icon: FileText },
    { id: 'galaxy', label: 'Clause Galaxy', icon: Library },
  ];

  return (
    <aside className="w-64 glass border-r border-primary/10 hidden lg:flex flex-col p-6 gap-8 h-screen sticky top-0">
      <div className="flex items-center gap-3 text-primary mb-4">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
          <Orbit size={20} strokeWidth={3} />
        </div>
        <h2 className="text-slate-100 text-xl font-bold tracking-tight">LegalOrbit</h2>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeTab === item.id 
                ? "bg-primary text-background-dark font-bold shadow-lg shadow-primary/20" 
                : "text-primary/60 hover:bg-primary/10 hover:text-primary"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20">
        <p className="text-xs text-primary font-bold uppercase tracking-tighter mb-2">Storage Status</p>
        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden mb-3">
          <div className="h-full bg-primary rounded-full w-[72%]"></div>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">7.2GB of 10GB used across your fleet.</p>
      </div>
    </aside>
  );
};

const Header = ({ onToggleTheme, isDark }: { onToggleTheme: () => void, isDark: boolean }) => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-primary/10 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center bg-surface/50 rounded-full px-4 py-1.5 border border-primary/10">
          <Search size={18} className="text-primary/60" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-100 placeholder:text-primary/40 w-64 ml-2" 
            placeholder="Search orbit..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          <Notifications size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

const AnalyticsDashboard = ({ data }: { data: DocumentData }) => {
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Helper: Add Section Header
      const addSection = (title: string) => {
        if (y > 250) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(242, 204, 13); // Primary color
        pdf.text(title, margin, y);
        y += 10;
        pdf.setDrawColor(242, 204, 13, 0.2);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 10;
      };

      // Helper: Add Text
      const addText = (text: string, size = 10, isBold = false) => {
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(40, 40, 40);
        const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
        if (y + lines.length * (size / 2) > 280) { pdf.addPage(); y = 20; }
        pdf.text(lines, margin, y);
        y += lines.length * (size / 2) + 5;
      };

      // 1. Header
      pdf.setFillColor(10, 9, 4); // background-dark
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setFont('helvetica', 'black');
      pdf.setFontSize(24);
      pdf.setTextColor(242, 204, 13);
      pdf.text('LEGAL ORBIT', margin, 25);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Comprehensive Legal Analysis Report', margin, 35);
      y = 55;

      // 2. Document Information
      addSection('1. Document Information');
      addText(`Document Title: ${data.document.title}`, 11, true);
      addText(`Upload Date: ${new Date(data.document.created_at).toLocaleDateString()}`);
      addText(`Document Category: ${data.document.category || 'N/A'}`);
      addText(`Total Number of Clauses: ${data.clauses.length}`);
      addText(`Overall Risk Score: ${data.document.overall_risk_score}/100`);
      addText(`Document Complexity Score: ${data.document.complexity_score}/100`);

      // 3. Document Summary
      addSection('2. Document Summary');
      addText(data.document.purpose || 'No summary available.');

      // 4. Clause Analysis
      addSection('3. Clause Analysis');
      data.clauses.forEach((clause, idx) => {
        addText(`${idx + 1}. ${clause.clause_title}`, 12, true);
        addText(`Importance Score: ${clause.importance_score}% | Risk Level: ${clause.risk_level}`);
        addText('Simplified Explanation:', 10, true);
        addText(clause.simplified_text);
        addText('Original Text:', 8, false);
        pdf.setTextColor(100, 100, 100);
        addText(clause.clause_text.substring(0, 300) + (clause.clause_text.length > 300 ? '...' : ''), 8);
        y += 5;
      });

      // 5. Visualization Summary
      addSection('4. Solar System Visualization');
      addText('The Solar System visualization interprets the document structure as follows:');
      addText('• Sun: The main purpose and core objective of the document.');
      addText('• Planets: Individual legal clauses orbiting the core purpose.');
      addText('• Orbit Distance: Represents clause importance (closer = more critical).');
      addText('• Planet Size: Represents the risk level associated with the clause.');

      // 6. Clause Galaxy Analysis
      addSection('5. Clause Galaxy Analysis');
      addText('The Galaxy view groups clauses by legal themes:');
      const categories = [...new Set(data.clauses.map(c => c.category))];
      addText(`Detected Themes: ${categories.join(', ')}`);
      addText('Interconnected clusters indicate high dependency between financial and liability provisions.');

      // 7. Trajectory Analysis
      addSection('6. Trajectory Analysis Results');
      addText('Predicted Future Risk Projection: Moderate Stability');
      addText('Predicted Influence Shifts: Liability clauses are expected to gain importance over time.');
      addText('Trajectory Result: The system predicts that liability-related clauses may increase overall legal risk if obligations are not fulfilled.');

      // 8. Risk and Analytics Summary
      addSection('7. Risk and Analytics Summary');
      addText(`Overall Risk Score: ${data.document.overall_risk_score}/100`);
      addText(`High Risk Clauses: ${data.clauses.filter(c => c.risk_level === 'High').length}`);
      addText(`Moderate Risk Clauses: ${data.clauses.filter(c => c.risk_level === 'Medium').length}`);
      addText(`Low Risk Clauses: ${data.clauses.filter(c => c.risk_level === 'Low').length}`);

      // 9. System Interpretation
      addSection('8. System Interpretation');
      addText(`The contract contains ${data.document.overall_risk_score > 60 ? 'significant' : 'moderate'} legal risk primarily related to ${data.clauses.find(c => c.risk_level === 'High')?.clause_title || 'various'} clauses.`);
      addText('Users should review the penalty and indemnification clauses carefully before proceeding.');

      // Footer
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages} | Generated by LegalOrbit on ${new Date().toLocaleString()}`, pageWidth / 2, 290, { align: 'center' });
      }

      pdf.save(`${data.document.title.replace(/\s+/g, '_')}_Full_Analysis.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const distributionData = [
    { name: 'Liability', value: 42, color: '#f2cc0d' },
    { name: 'Termination', value: 28, color: 'rgba(242, 204, 13, 0.6)' },
    { name: 'Intellectual Prop', value: 30, color: 'rgba(242, 204, 13, 0.2)' },
  ];

  return (
    <div ref={dashboardRef} className="space-y-10 animate-in fade-in duration-500 bg-background-dark p-4 rounded-3xl">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-100 mb-2">
              Solar Analytics <span className="text-primary">.</span>
            </h1>
            <p className="text-slate-400 max-w-2xl">
              Visualizing structural integrity and risk trajectory for {data.document.title}.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportToPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg border border-primary/20 hover:bg-primary/10 text-primary text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={18} /> {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button className="px-4 py-2 rounded-lg bg-primary text-background-dark text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
              <Share2 size={18} /> Share Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="glass p-6 rounded-2xl border-l-4 border-l-primary hover:translate-y-[-4px] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <p className="text-primary/60 text-xs font-bold uppercase tracking-widest">Risk Score</p>
              <AlertTriangle size={20} className="text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-100 tracking-tighter">{data.document.overall_risk_score}</h3>
              <p className="text-slate-400 text-sm font-medium">/ 100</p>
            </div>
            <p className="text-red-400 text-xs font-bold mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> +5% vs avg
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border-l-4 border-l-primary/40 hover:translate-y-[-4px] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <p className="text-primary/60 text-xs font-bold uppercase tracking-widest">Complexity</p>
              <Hub size={20} className="text-primary/60" />
            </div>
            <h3 className="text-4xl font-black text-slate-100 tracking-tighter">
              {data.document.complexity_score > 70 ? 'HIGH' : data.document.complexity_score > 40 ? 'MID' : 'LOW'}
            </h3>
            <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1">
              <TrendingDown size={14} /> -2% vs v1
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border-l-4 border-l-primary/40 hover:translate-y-[-4px] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <p className="text-primary/60 text-xs font-bold uppercase tracking-widest">Fairness</p>
              <Scale size={20} className="text-primary/60" />
            </div>
            <h3 className="text-4xl font-black text-slate-100 tracking-tighter">{data.document.fairness_index}%</h3>
            <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> +1.4%
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border-l-4 border-l-primary/40 hover:translate-y-[-4px] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <p className="text-primary/60 text-xs font-bold uppercase tracking-widest">Clauses</p>
              <Segment size={20} className="text-primary/60" />
            </div>
            <h3 className="text-4xl font-black text-slate-100 tracking-tighter">{data.clauses.length}</h3>
            <p className="text-slate-400 text-xs font-bold mt-2">Active provisions</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 glass p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-primary" /> Clause Distribution
          </h3>
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-3xl font-black text-slate-100">{data.clauses.length}</p>
              <p className="text-[10px] uppercase text-slate-400 tracking-widest">Total</p>
            </div>
          </div>
          <div className="space-y-3 mt-auto">
            {distributionData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <div className="size-2 rounded-full" style={{ backgroundColor: item.color }}></div> {item.name}
                </span>
                <span className="font-bold text-slate-100">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 glass p-6 rounded-2xl overflow-hidden">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <GridView size={20} className="text-primary" /> Risk Heatmap Grid
          </h3>
          <div className="grid grid-cols-6 gap-2 h-full pb-8">
            <div className="col-start-2 text-center text-[10px] text-primary/60 font-bold uppercase">Financial</div>
            <div className="text-center text-[10px] text-primary/60 font-bold uppercase">Legal</div>
            <div className="text-center text-[10px] text-primary/60 font-bold uppercase">Ops</div>
            <div className="text-center text-[10px] text-primary/60 font-bold uppercase">IP</div>
            <div className="text-center text-[10px] text-primary/60 font-bold uppercase">Force Majeure</div>
            
            <div className="text-right text-[10px] text-primary/60 font-bold uppercase flex items-center justify-end pr-2">Critical</div>
            <div className="bg-primary/80 rounded-lg aspect-square flex items-center justify-center text-background-dark font-black hover:scale-110 transition-transform cursor-help">9</div>
            <div className="bg-primary/40 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/20 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/60 rounded-lg aspect-square flex items-center justify-center text-background-dark font-black hover:scale-110 transition-transform cursor-help">4</div>
            <div className="bg-primary/10 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>

            <div className="text-right text-[10px] text-primary/60 font-bold uppercase flex items-center justify-end pr-2">Moderate</div>
            <div className="bg-primary/20 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/60 rounded-lg aspect-square flex items-center justify-center text-background-dark font-black hover:scale-110 transition-transform cursor-help">12</div>
            <div className="bg-primary/40 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/10 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/20 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>

            <div className="text-right text-[10px] text-primary/60 font-bold uppercase flex items-center justify-end pr-2">Low</div>
            <div className="bg-primary/10 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/10 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/40 rounded-lg aspect-square flex items-center justify-center text-background-dark font-black hover:scale-110 transition-transform cursor-help">21</div>
            <div className="bg-primary/20 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
            <div className="bg-primary/10 rounded-lg aspect-square hover:scale-110 transition-transform cursor-help"></div>
          </div>
        </div>
      </section>

      <section className="glass p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Waves size={20} className="text-primary" /> Harmony Wave
            </h3>
            <p className="text-xs text-slate-400 mt-1">Measuring the equilibrium between obligation and protection throughout the document duration.</p>
          </div>
          <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest">Balanced</div>
        </div>
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-surface/30">
          <div className="absolute inset-x-0 top-1/2 h-px bg-primary/10"></div>
          <div className="harmony-wave absolute inset-0 opacity-80 animate-pulse"></div>
          <div className="absolute top-0 left-[30%] h-full w-px bg-primary/40 border-l border-dashed flex flex-col justify-start">
            <div className="bg-primary text-background-dark text-[8px] font-black px-1 py-0.5 rounded ml-2 mt-2">PEAK RISK</div>
          </div>
        </div>
        <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <span>Preamble</span>
          <span>Service Levels</span>
          <span>Financials</span>
          <span>IP & Confidentiality</span>
          <span>Termination</span>
          <span>Execution</span>
        </div>
      </section>

      <section className="glass p-6 rounded-2xl relative overflow-hidden">
        <h3 className="text-lg font-bold text-slate-100 mb-8 flex items-center gap-2">
          <Timeline size={20} className="text-primary" /> Importance Timeline
        </h3>
        <div className="relative pl-8 border-l-2 border-primary/10 space-y-12 pb-4">
          {data.clauses.slice(0, 3).map((clause, idx) => (
            <div key={clause.id} className="relative">
              <div className={cn(
                "absolute -left-[41px] top-0 size-5 rounded-full border-4 border-background-dark ring-4",
                idx === 0 ? "bg-primary ring-primary/10" : idx === 1 ? "bg-surface ring-primary/5" : "bg-red-500 ring-red-500/10"
              )}></div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-slate-100 font-bold text-sm">{clause.clause_title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{clause.simplified_text.substring(0, 100)}...</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded",
                  idx === 0 ? "text-primary bg-primary/10" : idx === 1 ? "text-slate-500 bg-surface" : "text-red-400 bg-red-500/10"
                )}>
                  {idx === 0 ? 'MANDATORY' : idx === 1 ? 'OPERATIONAL' : 'HIGH IMPACT'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const DocumentVault = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/document')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
      })
      .then(data => {
        setDocs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching documents:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-primary">Loading fleet...</div>;

  return (
    <div className="p-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-100">Document Vault</h1>
        <button className="bg-primary text-background-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Plus size={20} /> New Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map(doc => (
          <div 
            key={doc.id} 
            onClick={() => onSelect(doc.id)}
            className="glass p-6 rounded-2xl cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{doc.category}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">{doc.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-4">{doc.purpose}</p>
            <div className="flex justify-between items-center pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-primary" />
                <span className="text-xs font-bold text-slate-100">{doc.overall_risk_score} Risk</span>
              </div>
              <ChevronRight size={16} className="text-primary/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, onProcessed }: { isOpen: boolean, onClose: () => void, onProcessed: (id: string) => void }) => {
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
      const aiData = await processDocumentWithAI(title, text);

      // 2. Send processed data to Backend
      const res = await fetch('/api/document/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          title,
          aiData // Send the already processed data
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = 'Failed to process document';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server Error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      onProcessed(data.document_id);
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

  useEffect(() => {
    if (currentDocId) {
      fetch(`/api/document/${currentDocId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch document');
          return res.json();
        })
        .then(data => setDocData(data))
        .catch(err => console.error('Error fetching document:', err));
    }
  }, [currentDocId]);

  useEffect(() => {
    console.log("Active Tab:", activeTab);
    console.log("Current Doc Data:", docData);
  }, [activeTab, docData]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn("flex min-h-screen w-full", isDark ? "dark" : "")}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onToggleTheme={toggleTheme} isDark={isDark} />
        
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
                <DocumentVault onSelect={(id) => {
                  setCurrentDocId(id);
                  setActiveTab('dashboard');
                }} />
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
  );
}

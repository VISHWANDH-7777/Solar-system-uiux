import React, { useState } from 'react';
import { 
  BarChart3 as Analytics, 
  Download, 
  FileText, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const AnalyticsDashboard = ({ data }: { data: any }) => {
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a'
      });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LegalOrbit_Analysis_${data.title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const riskData = [
    { name: 'High', value: data.riskProfile.high, color: '#ef4444' },
    { name: 'Medium', value: data.riskProfile.medium, color: '#f59e0b' },
    { name: 'Low', value: data.riskProfile.low, color: '#10b981' },
  ];

  const sentimentData = [
    { name: 'Favorable', value: 65 },
    { name: 'Neutral', value: 25 },
    { name: 'Unfavorable', value: 10 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" ref={dashboardRef}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Analytics size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Orbital Analysis Report</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">{data.title}</h1>
        </div>
        <button 
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-primary text-background-dark px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
        >
          <Download size={18} />
          {isExporting ? "Exporting..." : "Export Intelligence"}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Clauses', value: data.clauses.length, icon: FileText, color: 'text-blue-400' },
          { label: 'Risk Score', value: `${data.score}/100`, icon: Shield, color: 'text-red-400' },
          { label: 'Analysis Time', value: '1.2s', icon: Clock, color: 'text-purple-400' },
          { label: 'Compliance', value: '94%', icon: CheckCircle2, color: 'text-green-400' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border border-primary/10"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-slate-800 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-100">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-primary/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Risk Distribution
            </h3>
            <div className="flex gap-4">
              {riskData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(0,242,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00f2ff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#00f2ff" fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-primary/10">
          <h3 className="text-lg font-bold text-slate-100 mb-8 flex items-center gap-2">
            <PieChart size={18} className="text-primary" />
            Sentiment Analysis
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#64748b', '#ef4444'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {sentimentData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{d.name}</span>
                <span className="text-slate-100 font-bold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl border border-primary/10">
        <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-400" />
          Critical Findings
        </h3>
        <div className="space-y-4">
          {data.clauses.filter((c: any) => c.risk === 'high').map((clause: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex gap-4">
              <div className="size-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertCircle size={16} />
              </div>
              <div>
                <h4 className="text-slate-100 font-bold text-sm mb-1">{clause.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{clause.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Info, 
  Zap, 
  AlertTriangle, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Library,
  Orbit as OrbitIcon,
  TrendingUp,
  Network as Hub
} from 'lucide-react';
import { Clause, DocumentData } from '../types';

interface UniverseParams {
  complexity: number;
  risk: number;
  stability: number;
}

interface Galaxy {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  clauses: Clause[];
  riskDensity: number;
  influence: number;
}

interface SolarSystem {
  id: string;
  name: string;
  x: number;
  y: number;
  clauses: Clause[];
  risk: number;
}

interface Planet {
  id: string;
  clause: Clause;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  radius: number;
  color: string;
}

export const ClauseUniverse: React.FC<{ data: DocumentData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [view, setView] = useState<'UNIVERSE' | 'GALAXY' | 'SOLAR'>('UNIVERSE');
  const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Group clauses into galaxies
  const universeData = useMemo(() => {
    const categories = [
      { id: 'Financial', name: 'Payment & Financial', color: '#f2cc0d' },
      { id: 'Obligations', name: 'Obligations & Duties', color: '#3b82f6' },
      { id: 'Liability', name: 'Liability & Risk', color: '#ef4444' },
      { id: 'Termination', name: 'Termination & Enforcement', color: '#a855f7' },
      { id: 'General', name: 'General & Confidentiality', color: '#10b981' },
    ];

    const galaxies: Galaxy[] = categories.map((cat, idx) => {
      // Fallback: If category is missing, put it in 'General'
      const catClauses = data.clauses.filter(c => {
        if (cat.id === 'General') {
          return c.category === cat.id || !c.category;
        }
        return c.category === cat.id;
      });
      const angle = (idx / categories.length) * Math.PI * 2;
      const dist = 300;
      
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        clauses: catClauses,
        riskDensity: catClauses.reduce((acc, c) => acc + (c.risk_level === 'High' ? 100 : c.risk_level === 'Medium' ? 50 : 20), 0) / (catClauses.length || 1),
        influence: catClauses.reduce((acc, c) => acc + c.importance_score, 0) / (catClauses.length || 1),
      };
    });

    return {
      galaxies,
      params: {
        complexity: data.document.complexity_score,
        risk: data.document.overall_risk_score,
        stability: data.document.fairness_index,
      }
    };
  }, [data]);

  // Generate solar systems and planets for a selected galaxy
  const galaxySystems = useMemo(() => {
    if (!selectedGalaxy) return [];
    
    // Group clauses by risk level within the galaxy
    const risks = ['High', 'Medium', 'Low'];
    const systems: SolarSystem[] = risks.map((risk, idx) => {
      const sysClauses = selectedGalaxy.clauses.filter(c => c.risk_level === risk);
      const angle = (idx / risks.length) * Math.PI * 2;
      const dist = 150;
      
      return {
        id: `${selectedGalaxy.id}-${risk}`,
        name: `${risk} Risk Cluster`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        clauses: sysClauses,
        risk: risk === 'High' ? 100 : risk === 'Medium' ? 50 : 20,
      };
    });

    return systems;
  }, [selectedGalaxy]);

  const planets = useMemo(() => {
    if (!selectedGalaxy) return [];
    
    const allPlanets: Planet[] = [];
    galaxySystems.forEach(sys => {
      sys.clauses.forEach((clause, idx) => {
        const orbitRadius = 40 + idx * 20;
        const orbitSpeed = 0.005 + Math.random() * 0.01;
        const angle = Math.random() * Math.PI * 2;
        const importance = clause.importance_score;
        const risk = clause.risk_level === 'High' ? 80 : clause.risk_level === 'Medium' ? 50 : 20;
        
        allPlanets.push({
          id: clause.id,
          clause,
          orbitRadius,
          orbitSpeed,
          angle,
          radius: 4 + (importance / 15),
          color: risk > 60 ? '#ef4444' : risk > 30 ? '#f59e0b' : '#10b981',
        });
      });
    });
    
    return allPlanets;
  }, [galaxySystems, selectedGalaxy]);

  useEffect(() => {
    console.log("ClauseUniverse mounted with data:", data);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = (width: number, height: number) => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
        console.log(`Canvas resized to: ${width}x${height}`);
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        resize(width, height);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Apply camera transform
      ctx.save();
      ctx.translate(centerX + cameraPos.x, centerY + cameraPos.y);
      ctx.scale(zoom, zoom);

      // Draw Background Starfield
      drawStars(ctx, time);
      drawNebula(ctx, time);

      if (view === 'UNIVERSE') {
        drawUniverse(ctx, time, universeData.galaxies);
      } else if (view === 'GALAXY' && selectedGalaxy) {
        drawGalaxy(ctx, time, selectedGalaxy, galaxySystems, planets);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    const drawStars = (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 200; i++) {
        const x = (Math.sin(i * 13) * 1000);
        const y = (Math.cos(i * 17) * 1000);
        const size = Math.random() * 2;
        const opacity = 0.2 + Math.random() * 0.8 * (0.5 + 0.5 * Math.sin(time * 0.01 + i));
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawNebula = (ctx: CanvasRenderingContext2D, time: number) => {
      const centerX = 0;
      const centerY = 0;
      const grad = ctx.createRadialGradient(
        centerX + Math.sin(time * 0.001) * 200,
        centerY + Math.cos(time * 0.001) * 200,
        0,
        centerX,
        centerY,
        1000
      );
      grad.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.05)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(-1000, -1000, 2000, 2000);
    };

    const drawUniverse = (ctx: CanvasRenderingContext2D, time: number, galaxies: Galaxy[]) => {
      galaxies.forEach(galaxy => {
        // Draw Galaxy Nebula
        const grad = ctx.createRadialGradient(galaxy.x, galaxy.y, 0, galaxy.x, galaxy.y, 100);
        grad.addColorStop(0, `${galaxy.color}44`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(galaxy.x, galaxy.y, 100, 0, Math.PI * 2);
        ctx.fill();

        // Draw Spiral Arms
        ctx.strokeStyle = `${galaxy.color}22`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const armAngle = time * 0.005 + (i * Math.PI * 2) / 3;
          for (let r = 0; r < 80; r += 2) {
            const a = armAngle + r * 0.1;
            const x = galaxy.x + Math.cos(a) * r;
            const y = galaxy.y + Math.sin(a) * r;
            if (r === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Draw Core
        ctx.fillStyle = galaxy.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = galaxy.color;
        ctx.beginPath();
        ctx.arc(galaxy.x, galaxy.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(galaxy.name, galaxy.x, galaxy.y + 120);
        ctx.font = '10px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${galaxy.clauses.length} Clauses`, galaxy.x, galaxy.y + 135);
      });
    };

    const drawGalaxy = (ctx: CanvasRenderingContext2D, time: number, galaxy: Galaxy, systems: SolarSystem[], planets: Planet[]) => {
      // Draw Galaxy Core
      const sunRadius = 30 + Math.sin(time * 0.02) * 2;
      const sunGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sunRadius * 2);
      sunGrad.addColorStop(0, galaxy.color);
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sunRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Systems
      systems.forEach(sys => {
        // Draw System Star
        ctx.fillStyle = sys.risk > 70 ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(sys.x, sys.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(sys.name, sys.x, sys.y + 20);
      });

      // Draw Planets
      planets.forEach(planet => {
        // Find parent system
        const sys = systems.find(s => s.clauses.some(c => c.id === planet.id));
        if (!sys) return;

        planet.angle += planet.orbitSpeed;
        const x = sys.x + Math.cos(planet.angle) * planet.orbitRadius;
        const y = sys.y + Math.sin(planet.angle) * planet.orbitRadius;

        // Orbit trail
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.arc(sys.x, sys.y, planet.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Planet or Black Hole
        if (planet.clause.risk_level === 'High' && planet.clause.legal_risk > 85) {
          // Black Hole
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x, y, planet.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Event Horizon
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, planet.radius * 1.5 + 2 + Math.sin(time * 0.1) * 2, 0, Math.PI * 2);
          ctx.stroke();
          
          // Distortion effect
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.beginPath();
          ctx.ellipse(x, y, planet.radius * 4, planet.radius * 1.5, time * 0.05, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Planet
          ctx.fillStyle = planet.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = planet.color;
          ctx.beginPath();
          ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Gravitational links if selected
        if (selectedPlanet && selectedPlanet.id === planet.id) {
          ctx.strokeStyle = `${planet.color}88`;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(sys.x, sys.y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Energy beam to core
          ctx.strokeStyle = `${planet.color}44`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(0, 0);
          ctx.stroke();
        }
      });
    };

    render();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [view, selectedGalaxy, galaxySystems, planets, cameraPos, zoom, universeData]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - cameraPos.x) / zoom;
    const y = (e.clientY - rect.top - canvas.height / 2 - cameraPos.y) / zoom;

    if (view === 'UNIVERSE') {
      const clickedGalaxy = universeData.galaxies.find(g => {
        const d = Math.sqrt((x - g.x) ** 2 + (y - g.y) ** 2);
        return d < 100;
      });

      if (clickedGalaxy) {
        setSelectedGalaxy(clickedGalaxy);
        setView('GALAXY');
        setZoom(1.5);
        setCameraPos({ x: 0, y: 0 });
      }
    } else if (view === 'GALAXY') {
      // Check for planet click
      const clickedPlanet = planets.find(p => {
        const sys = galaxySystems.find(s => s.clauses.some(c => c.id === p.id));
        if (!sys) return false;
        const px = sys.x + Math.cos(p.angle) * p.orbitRadius;
        const py = sys.y + Math.sin(p.angle) * p.orbitRadius;
        const d = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        return d < p.radius + 10;
      });

      if (clickedPlanet) {
        setSelectedPlanet(clickedPlanet);
      } else {
        setSelectedPlanet(null);
      }
    }
  };

  const resetView = () => {
    setView('UNIVERSE');
    setSelectedGalaxy(null);
    setSelectedPlanet(null);
    setZoom(1);
    setCameraPos({ x: 0, y: 0 });
  };

  if (!data.clauses || data.clauses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background-dark text-slate-400">
        <Library size={48} className="mb-4 opacity-20" />
        <p>No clauses found in this document ecosystem.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full flex-1 min-h-[500px] overflow-hidden bg-background-dark transition-all duration-700 ${isFullScreen ? 'fixed inset-0 z-[200]' : ''}`}
    >
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        className="block w-full h-full cursor-crosshair"
      />

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none">
        <div className="glass p-4 rounded-2xl border-l-4 border-l-primary pointer-events-auto">
          <h3 className="text-primary font-black text-xs uppercase tracking-widest mb-1">Universe Status</h3>
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full animate-pulse ${universeData.params.risk > 60 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <span className="text-slate-100 font-bold text-sm">
              {universeData.params.risk > 60 ? 'CRITICAL ECOSYSTEM' : 'STABLE UNIVERSE'}
            </span>
          </div>
        </div>

        {view === 'UNIVERSE' && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass p-6 rounded-2xl pointer-events-auto border border-primary/10 w-64"
          >
            <h4 className="text-primary font-black text-xs uppercase tracking-widest mb-4">Universe Metrics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Complexity</span>
                <span className="text-sm font-black text-slate-100">{universeData.params.complexity}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Risk Index</span>
                <span className="text-sm font-black text-red-400">{universeData.params.risk}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Stability</span>
                <span className="text-sm font-black text-emerald-400">{universeData.params.stability}%</span>
              </div>
              <div className="pt-4 border-t border-primary/10">
                <p className="text-[10px] text-primary/60 font-bold uppercase mb-2">Galaxy Distribution</p>
                <div className="space-y-2">
                  {universeData.galaxies.map(g => (
                    <div key={g.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full" style={{ backgroundColor: g.color }}></div>
                        <span className="text-[9px] text-slate-300">{g.name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-100">{g.clauses.length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'GALAXY' && selectedGalaxy && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass p-4 rounded-2xl pointer-events-auto border border-primary/10"
          >
            <h4 className="text-primary font-black text-[10px] uppercase tracking-widest mb-2">{selectedGalaxy.name}</h4>
            <div className="space-y-2">
              <MetricBar label="Risk Density" value={selectedGalaxy.riskDensity} color="bg-red-500" />
              <MetricBar label="Influence" value={selectedGalaxy.influence} color="bg-primary" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute top-6 right-6 flex gap-3">
        {view !== 'UNIVERSE' && (
          <button 
            onClick={resetView}
            className="glass px-4 py-2 rounded-xl text-primary font-bold text-sm flex items-center gap-2 hover:bg-primary/10 transition-all border border-primary/20"
          >
            <Library size={18} />
            Universe View
          </button>
        )}
        <button 
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="glass p-3 rounded-xl text-primary hover:bg-primary/10 transition-all"
        >
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Selected Planet Detail Panel */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 w-80 h-full glass border-l border-primary/10 p-6 flex flex-col gap-6 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: selectedPlanet.color }}></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Clause Planet</span>
              </div>
              <button onClick={() => setSelectedPlanet(null)} className="p-1 hover:bg-primary/10 rounded-full">
                <X size={20} className="text-primary" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-100 mb-2">{selectedPlanet.clause.clause_title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedPlanet.clause.simplified_text}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Importance" value={`${selectedPlanet.clause.importance_score}%`} icon={Zap} />
              <StatCard label="Risk Level" value={selectedPlanet.clause.risk_level} icon={AlertTriangle} color={selectedPlanet.clause.risk_level === 'High' ? 'text-red-400' : 'text-emerald-400'} />
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Risk Vectors</h4>
              <MetricBar label="Financial" value={selectedPlanet.clause.financial_risk} color="bg-red-500" />
              <MetricBar label="Legal" value={selectedPlanet.clause.legal_risk} color="bg-orange-500" />
              <MetricBar label="Operational" value={selectedPlanet.clause.operational_risk} color="bg-blue-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 flex gap-6 glass px-6 py-3 rounded-full">
        <LegendItem color="bg-primary" label="Galaxy (Theme)" />
        <LegendItem color="bg-blue-500" label="Solar System (Cluster)" />
        <LegendItem color="bg-emerald-500" label="Safe Clause" />
        <LegendItem color="bg-red-500" label="Risk Clause" />
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div>
    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase mb-1">
      <span>{label}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = "text-primary" }: { label: string, value: string, icon: any, color?: string }) => (
  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={12} className="text-slate-400" />
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-sm font-black ${color}`}>{value}</p>
  </div>
);

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`size-2 rounded-full ${color}`}></div>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

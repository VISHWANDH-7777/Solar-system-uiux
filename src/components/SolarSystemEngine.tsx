import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  FileText, 
  Orbit as OrbitIcon, 
  Zap, 
  Shield, 
  Info, 
  X, 
  ChevronRight,
  Activity,
  Maximize2,
  Minimize2,
  TrendingUp,
  Network as Hub
} from 'lucide-react';
import { Clause, DocumentData } from '../types';

interface SolarSystemParams {
  systemMode: 'LIGHT' | 'DARK';
  sunIntensity: number;
  planetCount: number;
  gravityFactor: number;
  starDensity: number;
  positiveSignalScore: number;
  negativeSignalScore: number;
  chaosLevel: number;
}

interface CelestialObject {
  id: string;
  type: 'PLANET' | 'BLACKHOLE' | 'ASTEROID' | 'COMET';
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  color: string;
  importance: number;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  label: string;
  originalData?: any;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Comet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
}

export const SolarSystemEngine: React.FC<{ data: DocumentData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [systemMode, setSystemMode] = useState<'LIGHT' | 'DARK'>('DARK');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [comets, setComets] = useState<Comet[]>([]);
  
  // Derive parameters from document data
  const params: SolarSystemParams = useMemo(() => {
    const risk = data.document.overall_risk_score;
    const fairness = data.document.fairness_index;
    const complexity = data.document.complexity_score;
    
    return {
      systemMode,
      sunIntensity: fairness, // Fairness drives sun brightness
      planetCount: data.clauses.length,
      gravityFactor: 1 + (complexity / 100),
      starDensity: fairness * 2,
      positiveSignalScore: fairness,
      negativeSignalScore: risk,
      chaosLevel: risk > 70 ? (risk - 70) / 30 : 0
    };
  }, [data, systemMode]);

  // Initialize stars
  const stars = useMemo(() => {
    const count = Math.floor(params.starDensity * 5);
    const s: Star[] = [];
    for (let i = 0; i < count; i++) {
      s.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2,
        opacity: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.03,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
    return s;
  }, [params.starDensity]);

  // Initialize celestial objects
  const objects = useMemo(() => {
    const objs: CelestialObject[] = [];
    
    // Map clauses to planets
    data.clauses.forEach((clause, idx) => {
      const importance = clause.importance_score;
      const risk = clause.risk_level === 'High' ? 80 : clause.risk_level === 'Medium' ? 50 : 20;
      
      // Orbit mapping: High Importance -> Inner Orbit
      let orbitRadius;
      if (importance > 75) orbitRadius = 100 + Math.random() * 50;
      else if (importance > 40) orbitRadius = 200 + Math.random() * 80;
      else orbitRadius = 350 + Math.random() * 120;

      const baseSpeed = 0.005;
      const orbitSpeed = (baseSpeed * (1 / Math.sqrt(orbitRadius))) * (1 + Math.random() * 0.5);
      
      objs.push({
        id: clause.id,
        type: 'PLANET',
        radius: 5 + (importance / 10),
        orbitRadius,
        orbitSpeed,
        angle: Math.random() * Math.PI * 2,
        color: risk > 60 ? '#ef4444' : risk > 30 ? '#f59e0b' : '#10b981',
        importance,
        sentiment: risk > 60 ? 'NEGATIVE' : risk > 30 ? 'NEUTRAL' : 'POSITIVE',
        label: clause.clause_title,
        originalData: clause
      });
    });

    // Add Black Holes if risk is high
    if (params.negativeSignalScore > 60) {
      const bhCount = Math.floor((params.negativeSignalScore - 60) / 10) + 1;
      for (let i = 0; i < bhCount; i++) {
        objs.push({
          id: `bh-${i}`,
          type: 'BLACKHOLE',
          radius: 15 + Math.random() * 10,
          orbitRadius: 250 + Math.random() * 200,
          orbitSpeed: 0.002,
          angle: Math.random() * Math.PI * 2,
          color: '#000000',
          importance: 100,
          sentiment: 'NEGATIVE',
          label: 'Critical Risk Nexus'
        });
      }
    }

    // Add Asteroids for chaos
    if (params.chaosLevel > 0) {
      const astCount = Math.floor(params.chaosLevel * 20);
      for (let i = 0; i < astCount; i++) {
        objs.push({
          id: `ast-${i}`,
          type: 'ASTEROID',
          radius: 2 + Math.random() * 3,
          orbitRadius: 150 + Math.random() * 400,
          orbitSpeed: 0.01 + Math.random() * 0.02,
          angle: Math.random() * Math.PI * 2,
          color: '#71717a',
          importance: 10,
          sentiment: 'NEUTRAL',
          label: 'Uncertainty Fragment'
        });
      }
    }

    return objs;
  }, [data, params]);

  const startTrajectoryAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setSelectedObject(null);

    // Extract features for dynamic prediction
    const features = {
      clauseCount: data.clauses.length,
      avgImportance: data.clauses.reduce((acc, c) => acc + c.importance_score, 0) / (data.clauses.length || 1),
      overallRisk: data.document.overall_risk_score,
      fairness: data.document.fairness_index,
      complexity: data.document.complexity_score,
      penaltyClauses: data.clauses.filter(c => 
        (c.clause_title || '').toLowerCase().includes('penalty') || 
        (c.clause_text || '').toLowerCase().includes('penalty')
      ).length,
      liabilityClauses: data.clauses.filter(c => 
        (c.clause_title || '').toLowerCase().includes('liability') || 
        (c.clause_text || '').toLowerCase().includes('liability')
      ).length,
    };

    console.log("Document Features for Trajectory Analysis:", features);
    
    // Simulate analysis timeline
    const duration = 4000;
    const start = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnalysisProgress(progress);
      
      if (progress === 1) {
        clearInterval(interval);

        // Dynamic prediction logic
        const riskShift = (features.penaltyClauses * 5) + (features.liabilityClauses * 3) + (features.overallRisk * 0.1);
        const stability = Math.max(0, 100 - (features.complexity * 0.5) - (features.overallRisk * 0.3));
        const influence = (features.avgImportance * 0.8) + (features.clauseCount * 2);
        
        // Outcome probability calculation
        const winProb = Math.max(0, Math.min(100, features.fairness - (features.overallRisk * 0.4) + (Math.random() * 10 - 5)));
        const outcome = winProb > 60 ? 'Win' : winProb > 40 ? 'Settlement' : 'Lose';

        const results = {
          riskTrajectory: riskShift,
          stabilityScore: stability,
          influenceProjection: Math.min(100, influence),
          futureRiskProbability: features.overallRisk > 60 ? 'High' : features.overallRisk > 30 ? 'Medium' : 'Low',
          winProbability: Math.round(winProb),
          outcome: outcome
        };

        console.log("Prediction Results:", results);
        setAnalysisResults(results);
      }
    }, 16);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const container = containerRef.current;
      if (container && canvas) {
        requestAnimationFrame(() => {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Background Nebula
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width);
      if (params.systemMode === 'DARK') {
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#020617');
        gradient.addColorStop(1, '#000000');
      } else {
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#f1f5f9');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add Nebula Clouds (Dark mode only)
      if (params.systemMode === 'DARK') {
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) {
          const cx = centerX + Math.cos(time * 0.0005 + i * 2) * 300;
          const cy = centerY + Math.sin(time * 0.0005 + i * 2) * 300;
          const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 600);
          const color = i === 0 ? '59, 130, 246' : (i === 1 ? '147, 51, 234' : '30, 58, 138');
          cloudGrad.addColorStop(0, `rgba(${color}, 0.04)`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 600, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // Draw Starfield
      stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Global Orbits (Background)
      ctx.strokeStyle = params.systemMode === 'DARK' ? 'rgba(242, 204, 13, 0.03)' : 'rgba(242, 204, 13, 0.06)';
      ctx.lineWidth = 1;
      [125, 240, 410].forEach(r => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Asteroid Belt (Reflecting minor clauses or complexity)
      const beltRadius = 350;
      const beltWidth = 40;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = beltWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, beltRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw individual asteroids in the belt
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2 + time * 0.002;
        const radius = beltRadius + (Math.sin(i * 10) * beltWidth / 2);
        const ax = centerX + Math.cos(angle) * radius;
        const ay = centerY + Math.sin(angle) * radius;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.beginPath();
        ctx.arc(ax, ay, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Sun
      const sunPulseRate = isAnalyzing ? 0.1 : 0.02;
      const sunRadius = 40 + Math.sin(time * sunPulseRate) * 2;
      const sunGlow = 20 + (params.sunIntensity / 5) + Math.sin(time * 0.05) * 5;
      
      ctx.shadowBlur = sunGlow;
      ctx.shadowColor = isAnalyzing ? '#3b82f6' : (params.negativeSignalScore > 70 ? '#ef4444' : '#f2cc0d');
      
      const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sunRadius);
      if (isAnalyzing) {
        sunGradient.addColorStop(0, '#93c5fd');
        sunGradient.addColorStop(0.5, '#3b82f6');
        sunGradient.addColorStop(1, '#1e40af');
      } else if (params.negativeSignalScore > 70) {
        sunGradient.addColorStop(0, '#fca5a5');
        sunGradient.addColorStop(0.5, '#ef4444');
        sunGradient.addColorStop(1, '#991b1b');
      } else {
        sunGradient.addColorStop(0, '#fef9c3');
        sunGradient.addColorStop(0.5, '#f2cc0d');
        sunGradient.addColorStop(1, '#a16207');
      }
      
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Analysis Scan Waves
      if (isAnalyzing) {
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
          const waveProgress = (time * 0.02 + i / waveCount) % 1;
          const waveRadius = sunRadius + waveProgress * 600;
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - waveProgress})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Solar Flares if negative signals are high
      if (params.negativeSignalScore > 50 && !isAnalyzing) {
        const flareCount = 8;
        for (let i = 0; i < flareCount; i++) {
          const angle = (i / flareCount) * Math.PI * 2 + time * 0.01;
          const length = sunRadius + 10 + Math.sin(time * 0.1 + i) * 10;
          ctx.strokeStyle = params.negativeSignalScore > 70 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(242, 204, 13, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * sunRadius, centerY + Math.sin(angle) * sunRadius);
          ctx.lineTo(centerX + Math.cos(angle) * length, centerY + Math.sin(angle) * length);
          ctx.stroke();
        }
      }

      // Draw Objects
      objects.forEach(obj => {
        // Update position
        const speedFactor = isAnalyzing ? (1 + analysisProgress * 3) : 1;
        obj.angle += obj.orbitSpeed * params.gravityFactor * speedFactor;
        
        let orbitRadius = obj.orbitRadius;
        if (isAnalyzing && obj.type === 'PLANET') {
          // Simulate future orbit shift
          const shift = (obj.sentiment === 'NEGATIVE' ? 60 : -40) * analysisProgress;
          orbitRadius += shift;
        }

        // Draw Individual Orbit Path
        if (obj.type === 'PLANET') {
          const isSelected = selectedObject?.id === obj.id;
          const baseOpacity = isAnalyzing ? 0.3 : (isSelected ? 0.2 : 0.05);
          
          ctx.beginPath();
          
          // Dynamic color based on risk and analysis
          if (isAnalyzing) {
            const riskColor = obj.sentiment === 'NEGATIVE' ? '239, 68, 68' : '59, 130, 246';
            const pulse = Math.sin(time * 0.1) * 0.1;
            ctx.strokeStyle = `rgba(${riskColor}, ${baseOpacity + pulse})`;
            ctx.lineWidth = obj.sentiment === 'NEGATIVE' ? 2 : 1;
            
            // Add "wobble" to unstable orbits during analysis
            if (obj.sentiment === 'NEGATIVE') {
              const segments = 64;
              for (let i = 0; i <= segments; i++) {
                const a = (i / segments) * Math.PI * 2;
                const wobble = Math.sin(a * 8 + time * 0.2) * 3 * analysisProgress;
                const ox = centerX + Math.cos(a) * (orbitRadius + wobble);
                const oy = centerY + Math.sin(a) * (orbitRadius + wobble);
                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
              }
            } else {
              ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
            }
          } else {
            ctx.strokeStyle = isSelected ? 'rgba(242, 204, 13, 0.3)' : 'rgba(242, 204, 13, 0.05)';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
          }
          
          ctx.stroke();

          // Draw "Flow" particles on the orbit
          if (isSelected || isAnalyzing) {
            const particleCount = isAnalyzing ? 4 : 2;
            for (let p = 0; p < particleCount; p++) {
              const pOffset = (p * Math.PI * 2 / particleCount);
              const pAngle = (time * obj.orbitSpeed * 3 + pOffset) % (Math.PI * 2);
              
              let px, py;
              if (isAnalyzing && obj.sentiment === 'NEGATIVE') {
                const wobble = Math.sin(pAngle * 8 + time * 0.2) * 3 * analysisProgress;
                px = centerX + Math.cos(pAngle) * (orbitRadius + wobble);
                py = centerY + Math.sin(pAngle) * (orbitRadius + wobble);
              } else {
                px = centerX + Math.cos(pAngle) * orbitRadius;
                py = centerY + Math.sin(pAngle) * orbitRadius;
              }
              
              ctx.fillStyle = isAnalyzing 
                ? (obj.sentiment === 'NEGATIVE' ? '#ef4444' : '#3b82f6') 
                : (isSelected ? '#f2cc0d' : obj.color);
              
              ctx.beginPath();
              ctx.arc(px, py, isAnalyzing ? 1.5 : 1, 0, Math.PI * 2);
              ctx.fill();
              
              // Add trail for particles during analysis
              if (isAnalyzing) {
                ctx.shadowBlur = 5;
                ctx.shadowColor = ctx.fillStyle as string;
                ctx.beginPath();
                ctx.arc(px, py, 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            }
          }
        }

        let x = centerX + Math.cos(obj.angle) * orbitRadius;
        let y = centerY + Math.sin(obj.angle) * orbitRadius;

        // Draw Trajectory Projection Lines
        if (isAnalyzing && obj.type === 'PLANET') {
          ctx.beginPath();
          ctx.strokeStyle = obj.sentiment === 'NEGATIVE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
          ctx.setLineDash([2, 4]);
          ctx.moveTo(centerX + Math.cos(obj.angle) * obj.orbitRadius, centerY + Math.sin(obj.angle) * obj.orbitRadius);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Apply Black Hole distortion
        objects.forEach(other => {
          if (other.type === 'BLACKHOLE' && other.id !== obj.id) {
            const bhX = centerX + Math.cos(other.angle) * other.orbitRadius;
            const bhY = centerY + Math.sin(other.angle) * other.orbitRadius;
            const dx = bhX - x;
            const dy = bhY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              const force = (150 - dist) / 150 * 2;
              x += (dx / dist) * force;
              y += (dy / dist) * force;
            }
          }
        });

        if (obj.type === 'BLACKHOLE') {
          // Black Hole Visuals
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x, y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Event Horizon Glow
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, obj.radius + 2 + Math.sin(time * 0.1) * 2, 0, Math.PI * 2);
          ctx.stroke();

          // Accretion Disk
          ctx.strokeStyle = 'rgba(147, 51, 234, 0.3)';
          ctx.beginPath();
          ctx.ellipse(x, y, obj.radius * 3, obj.radius, time * 0.05, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obj.type === 'PLANET') {
          // Planet Visuals
          ctx.shadowBlur = 10;
          ctx.shadowColor = obj.color;
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(x, y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Atmosphere/Ring for high importance or complexity
          if (obj.importance > 70) {
            const ringCount = obj.importance > 85 ? 2 : 1;
            for (let r = 0; r < ringCount; r++) {
              ctx.strokeStyle = `${obj.color}${r === 0 ? '44' : '22'}`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              const rx = obj.radius * (1.8 + r * 0.4);
              const ry = obj.radius * (0.6 + r * 0.2);
              ctx.ellipse(x, y, rx, ry, obj.angle + Math.PI / 4, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        } else if (obj.type === 'ASTEROID') {
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(x, y, obj.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Update and Draw Comets
      if (Math.random() < 0.005 && comets.length < 3) {
        const side = Math.floor(Math.random() * 4);
        let cx, cy, cvx, cvy;
        if (side === 0) { cx = 0; cy = Math.random() * canvas.height; cvx = 2 + Math.random() * 3; cvy = (Math.random() - 0.5) * 2; }
        else if (side === 1) { cx = canvas.width; cy = Math.random() * canvas.height; cvx = -2 - Math.random() * 3; cvy = (Math.random() - 0.5) * 2; }
        else if (side === 2) { cx = Math.random() * canvas.width; cy = 0; cvx = (Math.random() - 0.5) * 2; cvy = 2 + Math.random() * 3; }
        else { cx = Math.random() * canvas.width; cy = canvas.height; cvx = (Math.random() - 0.5) * 2; cvy = -2 - Math.random() * 3; }

        const newComet: Comet = {
          id: Math.random().toString(),
          x: cx, y: cy, vx: cvx, vy: cvy,
          size: 1 + Math.random() * 2,
          color: '#93c5fd',
          opacity: 1,
          life: 100 + Math.random() * 100
        };
        setComets(prev => [...prev, newComet]);
      }

      setComets(prev => prev.map(c => ({
        ...c,
        x: c.x + c.vx,
        y: c.y + c.vy,
        life: c.life - 1,
        opacity: c.life / 200
      })).filter(c => c.life > 0));

      comets.forEach(c => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = c.color;
        ctx.fillStyle = `rgba(147, 197, 253, ${c.opacity})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Comet tail
        const tailGrad = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * 20, c.y - c.vy * 20);
        tailGrad.addColorStop(0, `rgba(147, 197, 253, ${c.opacity * 0.5})`);
        tailGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = c.size;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x - c.vx * 20, c.y - c.vy * 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [stars, objects, params, isAnalyzing, analysisProgress]);

  const handleSunClick = () => {
    setSystemMode(prev => prev === 'LIGHT' ? 'DARK' : 'LIGHT');
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Check for sun click
    const dx = x - centerX;
    const dy = y - centerY;
    if (Math.sqrt(dx * dx + dy * dy) < 50) {
      handleSunClick();
      return;
    }

    // Check for object click
    let found = false;
    objects.forEach(obj => {
      const objX = centerX + Math.cos(obj.angle) * obj.orbitRadius;
      const objY = centerY + Math.sin(obj.angle) * obj.orbitRadius;
      const d = Math.sqrt((x - objX) ** 2 + (y - objY) ** 2);
      if (d < obj.radius + 10) {
        setSelectedObject(obj);
        found = true;
      }
    });

    if (!found) setSelectedObject(null);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full flex-1 overflow-hidden transition-colors duration-700 ${isFullScreen ? 'fixed inset-0 z-[200]' : ''}`}
    >
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
      />

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none">
        <div className="glass p-4 rounded-2xl border-l-4 border-l-primary pointer-events-auto">
          <h3 className="text-primary font-black text-xs uppercase tracking-widest mb-1">System Status</h3>
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full animate-pulse ${params.chaosLevel > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <span className="text-slate-100 font-bold text-sm">
              {params.chaosLevel > 0.5 ? 'UNSTABLE' : 'HARMONIOUS'}
            </span>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl pointer-events-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cosmic Metrics</span>
          </div>
          <div className="space-y-3">
            <MetricBar label="Sun Intensity" value={params.sunIntensity} color="bg-primary" />
            <MetricBar label="Gravity Factor" value={params.gravityFactor * 50} color="bg-purple-500" />
            <MetricBar label="Chaos Level" value={params.chaosLevel * 100} color="bg-red-500" />
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex gap-3">
        <button 
          onClick={startTrajectoryAnalysis}
          disabled={isAnalyzing}
          className="glass px-4 py-2 rounded-xl text-primary font-bold text-sm flex items-center gap-2 hover:bg-primary/10 transition-all border border-primary/20 shadow-lg shadow-primary/5 group disabled:opacity-50"
        >
          <Activity size={18} className="group-hover:rotate-12 transition-transform" />
          Analyze Trajectory
          {isAnalyzing && (
            <div className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-100" style={{ width: `${analysisProgress * 100}%` }}></div>
          )}
        </button>
        <button 
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="glass p-3 rounded-xl text-primary hover:bg-primary/10 transition-all"
        >
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Selected Object Detail Panel */}
      <AnimatePresence>
        {selectedObject && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 w-80 h-full glass border-l border-primary/10 p-6 flex flex-col gap-6 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full" style={{ backgroundColor: selectedObject.color }}></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedObject.type}</span>
              </div>
              <button onClick={() => setSelectedObject(null)} className="p-1 hover:bg-primary/10 rounded-full">
                <X size={20} className="text-primary" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-100 mb-2">{selectedObject.label}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedObject.originalData?.simplified_text || 'Cosmic anomaly detected in the legal structure.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Importance" value={`${selectedObject.importance}%`} icon={Zap} />
              <StatCard label="Risk Level" value={selectedObject.sentiment} icon={AlertTriangle} color={selectedObject.sentiment === 'NEGATIVE' ? 'text-red-400' : 'text-emerald-400'} />
            </div>

            {selectedObject.originalData && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Risk Vectors</h4>
                <MetricBar label="Financial" value={selectedObject.originalData.financial_risk} color="bg-red-500" />
                <MetricBar label="Legal" value={selectedObject.originalData.legal_risk} color="bg-orange-500" />
                <MetricBar label="Operational" value={selectedObject.originalData.operational_risk} color="bg-blue-500" />
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-primary/10">
              <button className="w-full bg-primary text-background-dark py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
                Analyze Trajectory
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trajectory Analysis Results Panel */}
      <AnimatePresence>
        {analysisResults && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 w-96 h-full glass border-l border-primary/10 p-8 flex flex-col gap-8 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">Trajectory Analysis</h2>
              <button onClick={() => setAnalysisResults(null)} className="p-1 hover:bg-primary/10 rounded-full">
                <X size={24} className="text-primary" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest mb-2">Stability Forecast</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-100">{Math.round(analysisResults.stabilityScore)}%</h3>
                  <span className="text-emerald-400 text-xs font-bold">STABLE</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">The system maintains structural integrity over the projected period.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Risk Trajectory" value={`+${Math.round(analysisResults.riskTrajectory)}%`} icon={TrendingUp} color="text-red-400" />
                <StatCard label="Influence" value={`${Math.round(analysisResults.influenceProjection)}%`} icon={Hub} />
              </div>

              <div className="bg-surface/50 p-6 rounded-2xl border border-primary/10">
                <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest mb-2">Case Outcome Prediction</p>
                <div className="flex items-baseline justify-between">
                  <h3 className={`text-3xl font-black ${analysisResults.outcome === 'Win' ? 'text-emerald-400' : analysisResults.outcome === 'Lose' ? 'text-red-400' : 'text-amber-400'}`}>
                    {analysisResults.outcome.toUpperCase()}
                  </h3>
                  <span className="text-slate-100 font-bold text-xl">{analysisResults.winProbability}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisResults.winProbability}%` }}
                    className={`h-full ${analysisResults.outcome === 'Win' ? 'bg-emerald-400' : analysisResults.outcome === 'Lose' ? 'bg-red-400' : 'bg-amber-400'}`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Future Risk Probability</h4>
                <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${analysisResults.futureRiskProbability === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    <span className="text-sm font-bold text-slate-100">{analysisResults.futureRiskProbability} Probability</span>
                  </div>
                  <ChevronRight size={18} className="text-primary/40" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Clause Evolution</h4>
                {data.clauses.slice(0, 3).map(clause => (
                  <div key={clause.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{clause.clause_title}</span>
                    <span className="text-emerald-400 font-bold">STABILIZING</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-primary/10 flex flex-col gap-3">
              <button 
                onClick={() => {
                  setAnalysisResults(null);
                  startTrajectoryAnalysis();
                }}
                className="w-full bg-primary text-background-dark py-4 rounded-xl font-black text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                REPLAY TRAJECTORY
              </button>
              <button 
                onClick={() => {
                  setAnalysisResults(null);
                  setIsAnalyzing(false);
                }}
                className="w-full bg-primary/10 text-primary py-4 rounded-xl font-bold text-sm border border-primary/20 hover:bg-primary/20 transition-all"
              >
                RETURN TO LIVE ORBIT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 flex gap-6 glass px-6 py-3 rounded-full">
        <LegendItem color="bg-primary" label="Sun (Stability)" />
        <LegendItem color="bg-emerald-500" label="Safe Clauses" />
        <LegendItem color="bg-red-500" label="Risk Clauses" />
        <LegendItem color="bg-black border border-white/20" label="Black Hole (Critical)" />
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

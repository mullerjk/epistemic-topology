import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';
import { useTranslation } from 'next-i18next';

const EpistemicTopologySimulation = () => {
  const { t } = useTranslation('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [params, setParams] = useState({
    diffusion: 0.5,      // D - coeficiente de difusão
    creation: 0.02,      // σ - taxa de criação
    dissipation: 0.01,   // μ - taxa de dissipação
    gridSize: 100
  });
  const [showInfo, setShowInfo] = useState(false);
  
  // Grid de densidade epistêmica ρ(x,y,t,s)
  // Simplificação: uma única "espécie" de conhecimento
  const [grid, setGrid] = useState<any[][] | null>(null);
  const [stats, setStats] = useState({ total: '0', max: '0', entropy: '0' });
  
  // Inicializar grid
  useEffect(() => {
    initializeGrid();
  }, [params.gridSize]);
  
  const initializeGrid = () => {
    const size = params.gridSize;
    const newGrid = Array(size).fill(0).map(() => Array(size).fill(0));
    
    // Sementes iniciais de conhecimento (pontos de criação)
    // Simulando "centros de conhecimento" - universidades, bibliotecas
    const seeds = [
      { x: 20, y: 20, intensity: 1.0 },
      { x: 70, y: 30, intensity: 0.8 },
      { x: 50, y: 80, intensity: 0.6 },
      { x: 30, y: 60, intensity: 0.9 }
    ];
    
    seeds.forEach(seed => {
      const radius = 3;
      for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
          const x = seed.x + i;
          const y = seed.y + j;
          if (x >= 0 && x < size && y >= 0 && y < size) {
            const dist = Math.sqrt(i*i + j*j);
            if (dist <= radius) {
              newGrid[y][x] = seed.intensity * (1 - dist/radius);
            }
          }
        }
      }
    });
    
    setGrid(newGrid);
    setTime(0);
  };
  
  // Equação mestra: ∂ρ/∂t = D·∇²ρ + σ - μ·ρ
  const updateGrid = () => {
    if (!grid) return;
    
    const size = params.gridSize;
    const newGrid = Array(size).fill(0).map(() => Array(size).fill(0));
    const dt = 0.1;
    const dx = 1.0;
    
    let totalKnowledge = 0;
    let maxDensity = 0;
    
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const current = grid[y][x];
        
        // Laplaciano (∇²ρ) - operador de difusão
        const laplacian = (
          grid[y-1][x] + grid[y+1][x] + 
          grid[y][x-1] + grid[y][x+1] - 
          4 * current
        ) / (dx * dx);
        
        // Termo de difusão
        const diffusion = params.diffusion * laplacian;
        
        // Termo de criação (espontânea + proporcional à densidade existente)
        // Simulando: conhecimento gera mais conhecimento
        const creation = params.creation * (0.1 + current * 0.5);
        
        // Termo de dissipação (esquecimento)
        const dissipation = params.dissipation * current;
        
        // Atualização temporal
        let newValue = current + dt * (diffusion + creation - dissipation);
        
        // Limites físicos: densidade não pode ser negativa ou infinita
        newValue = Math.max(0, Math.min(2.0, newValue));
        
        newGrid[y][x] = newValue;
        totalKnowledge += newValue;
        maxDensity = Math.max(maxDensity, newValue);
      }
    }
    
    // Condições de fronteira (reflexivas - conhecimento não "vaza" do sistema)
    for (let i = 0; i < size; i++) {
      newGrid[0][i] = newGrid[1][i];
      newGrid[size-1][i] = newGrid[size-2][i];
      newGrid[i][0] = newGrid[i][1];
      newGrid[i][size-1] = newGrid[i][size-2];
    }
    
    // Calcular entropia epistêmica (Shannon)
    let entropy = 0;
    if (totalKnowledge > 0) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const p = newGrid[y][x] / totalKnowledge;
          if (p > 0) {
            entropy -= p * Math.log2(p);
          }
        }
      }
    }
    
    setGrid(newGrid);
    setStats({ 
      total: totalKnowledge.toFixed(2), 
      max: maxDensity.toFixed(3),
      entropy: entropy.toFixed(2)
    });
    setTime(t => t + dt);
  };
  
  // Renderizar no canvas
  useEffect(() => {
    if (!grid || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = params.gridSize;
    const cellSize = canvas.width / size;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Renderizar densidade epistêmica com mapa de calor
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const density = grid[y][x];
        
        // Mapa de cor: azul (baixo) -> ciano -> verde -> amarelo -> vermelho (alto)
        let r, g, b;
        if (density < 0.25) {
          // Azul -> Ciano
          const t = density / 0.25;
          r = 0;
          g = Math.floor(t * 255);
          b = 255;
        } else if (density < 0.5) {
          // Ciano -> Verde
          const t = (density - 0.25) / 0.25;
          r = 0;
          g = 255;
          b = Math.floor((1 - t) * 255);
        } else if (density < 0.75) {
          // Verde -> Amarelo
          const t = (density - 0.5) / 0.25;
          r = Math.floor(t * 255);
          g = 255;
          b = 0;
        } else {
          // Amarelo -> Vermelho
          const t = (density - 0.75) / 0.25;
          r = 255;
          g = Math.floor((1 - t) * 255);
          b = 0;
        }
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [grid, params.gridSize]);
  
  // Loop de simulação
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      updateGrid();
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, grid, params]);
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">
          {t('simulation.title')}
        </h2>
        <p className="text-slate-300 text-sm">
          {t('simulation.equation')}
        </p>
      </div>
      
      {/* Canvas */}
      <div className="mb-6 bg-black rounded-lg p-4 flex justify-center">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={500}
          className="border-2 border-slate-700 rounded"
        />
      </div>
      
      {/* Legenda do mapa de calor */}
      <div className="mb-6 bg-slate-800 rounded p-3">
        <div className="text-white text-sm mb-2 font-semibold">{t('simulation.epistemicDensity')}</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">{t('simulation.low')}</span>
          <div className="flex-1 h-6 rounded" style={{
            background: 'linear-gradient(to right, rgb(0,0,255), rgb(0,255,255), rgb(0,255,0), rgb(255,255,0), rgb(255,0,0))'
          }}></div>
          <span className="text-slate-400 text-xs">{t('simulation.high')}</span>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700 rounded p-4">
          <div className="text-slate-400 text-xs mb-1">{t('simulation.totalKnowledge')}</div>
          <div className="text-white text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-slate-700 rounded p-4">
          <div className="text-slate-400 text-xs mb-1">{t('simulation.maxDensity')}</div>
          <div className="text-white text-2xl font-bold">{stats.max}</div>
        </div>
        <div className="bg-slate-700 rounded p-4">
          <div className="text-slate-400 text-xs mb-1">{t('simulation.entropy')}</div>
          <div className="text-white text-2xl font-bold">{stats.entropy}</div>
        </div>
      </div>
      
      {/* Controles */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? t('simulation.pause') : t('simulation.start')}
        </button>
        
        <button
          onClick={initializeGrid}
          className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
        >
          <RotateCcw size={20} />
          {t('simulation.restart')}
        </button>
        
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition ml-auto"
        >
          <Info size={20} />
          {showInfo ? t('simulation.hide') : t('simulation.info')}
        </button>
      </div>
      
      <div className="text-slate-400 text-sm mb-6">
        {t('simulation.time')} {time.toFixed(1)} {t('simulation.units')}
      </div>
      
      {/* Parâmetros */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-4">{t('simulation.paramsTitle')}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm flex justify-between mb-1">
              <span>{t('simulation.diffusion')} {params.diffusion.toFixed(2)}</span>
              <span className="text-slate-500">{t('simulation.sharing')}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.diffusion}
              onChange={(e) => setParams({...params, diffusion: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-slate-300 text-sm flex justify-between mb-1">
              <span>{t('simulation.creation')} {params.creation.toFixed(3)}</span>
              <span className="text-slate-500">{t('simulation.innovation')}</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.005"
              value={params.creation}
              onChange={(e) => setParams({...params, creation: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-slate-300 text-sm flex justify-between mb-1">
              <span>{t('simulation.dissipation')} {params.dissipation.toFixed(3)}</span>
              <span className="text-slate-500">{t('simulation.forgetting')}</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.002"
              value={params.dissipation}
              onChange={(e) => setParams({...params, dissipation: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Informações */}
      {showInfo && (
        <div className="bg-slate-800 rounded-lg p-4 text-slate-300 text-sm space-y-3">
          <h3 className="text-white font-semibold text-base mb-2">{t('simulation.howToInterpret')}</h3>
          
          <div>
            <strong className="text-blue-400">Cores:</strong> {t('simulation.colorsDesc')}
          </div>
          
          <div>
            <strong className="text-blue-400">Difusão (D):</strong> {t('simulation.diffusionDesc')}
          </div>
          
          <div>
            <strong className="text-blue-400">Criação (σ):</strong> {t('simulation.creationDesc')}
          </div>
          
          <div>
            <strong className="text-blue-400">Dissipação (μ):</strong> {t('simulation.dissipationDesc')}
          </div>
          
          <div>
            <strong className="text-blue-400">Φ (Total):</strong> {t('simulation.totalDesc')}
          </div>
          
          <div>
            <strong className="text-blue-400">Entropia:</strong> {t('simulation.entropyDesc')}
          </div>
          
          <div className="pt-2 border-t border-slate-700">
            <strong className="text-yellow-400">{t('simulation.experiments')}</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{t('simulation.exp1')}</li>
              <li>{t('simulation.exp2')}</li>
              <li>{t('simulation.exp3')}</li>
              <li>{t('simulation.exp4')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpistemicTopologySimulation;

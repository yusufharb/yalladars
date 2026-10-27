import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  Check
} from 'lucide-react';

interface InteractiveWhiteboardProps {
  onSaveSnapshot?: (dataUrl: string) => void;
  readOnly?: boolean;
  initialSnapshot?: string;
  className?: string;
}

type ToolType = 'pen' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle';

const COLORS = [
  { id: '#0f172a', name: 'أسود' },
  { id: '#1e40af', name: 'أزرق ملكي' },
  { id: '#b91c1c', name: 'أحمر' },
  { id: '#047857', name: 'أخضر' },
  { id: '#d97706', name: 'برتقالي' },
  { id: '#7c3aed', name: 'بنفسجي' },
];

const STROKE_WIDTHS = [
  { size: 2, label: 'رفيع' },
  { size: 4, label: 'متوسط' },
  { size: 8, label: 'عريض' },
];

export const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({
  onSaveSnapshot,
  readOnly = false,
  initialSnapshot,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);

  // Resize canvas according to container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Save current content before resizing
    const ctx = canvas.getContext('2d');
    let prevImage: ImageData | null = null;
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      try {
        prevImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        // ignore
      }
    }

    const rect = container.getBoundingClientRect();
    const newWidth = Math.max(300, Math.floor(rect.width));
    const newHeight = Math.max(260, Math.floor(rect.height || 420));

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;

      if (ctx) {
        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (prevImage) {
          ctx.putImageData(prevImage, 0, 0);
        } else if (initialSnapshot) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = initialSnapshot;
        }
      }
    }
  }, [initialSnapshot]);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas]);

  // Save state to undo history
  const pushState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(imgData);
      // Keep last 25 states
      if (newHistory.length > 25) newHistory.shift();
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    } catch {
      // ignore
    }
  };

  // Initial state save
  useEffect(() => {
    const timer = setTimeout(() => {
      pushState();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const undo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevStep = historyStep - 1;
    ctx.putImageData(history[prevStep], 0, 0);
    setHistoryStep(prevStep);
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextStep = historyStep + 1;
    ctx.putImageData(history[nextStep], 0, 0);
    setHistoryStep(nextStep);
  };

  const clearCanvas = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushState();
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen') {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = strokeWidth * 4;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      // For shapes (line, arrow, rect, circle): restore previous state and redraw live preview
      if (historyStep >= 0 && history[historyStep]) {
        ctx.putImageData(history[historyStep], 0, 0);
      }
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(coords.y - startPos.y, coords.x - startPos.x);
        const headLength = 12 + strokeWidth;
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(
          coords.x - headLength * Math.cos(angle - Math.PI / 6),
          coords.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(
          coords.x - headLength * Math.cos(angle + Math.PI / 6),
          coords.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (activeTool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
      } else if (activeTool === 'circle') {
        const radiusX = Math.abs(coords.x - startPos.x) / 2;
        const radiusY = Math.abs(coords.y - startPos.y) / 2;
        const centerX = Math.min(startPos.x, coords.x) + radiusX;
        const centerY = Math.min(startPos.y, coords.y) + radiusY;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    pushState();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `سبورة_حصة_يلا_درس_${new Date().toISOString().split('T')[0]}.png`;
    a.click();
  };

  const handleSaveSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSaveSnapshot) {
      onSaveSnapshot(dataUrl);
      setSnapshotSaved(true);
      setTimeout(() => setSnapshotSaved(false), 2500);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-700 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-full min-h-[380px]'
      } ${className}`}
    >
      {/* Top Floating Whiteboard Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-900/95 backdrop-blur-md px-3 py-2 border-b border-slate-800 text-white z-10">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-1.5 rounded-xl transition ${
                activeTool === 'pen' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="قلم للكتابة والرسم"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('line')}
              className={`p-1.5 rounded-xl transition ${
                activeTool === 'line' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="خط مستقيم"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('arrow')}
              className={`p-1.5 rounded-xl transition ${
                activeTool === 'arrow' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="سهم توضيحي"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('rect')}
              className={`p-1.5 rounded-xl transition ${
                activeTool === 'rect' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="مستطيل / مربع"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('circle')}
              className={`p-1.5 rounded-xl transition ${
                activeTool === 'circle' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="دائرة"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-1.5 rounded-xl transition ${
                activeTool === 'eraser' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="ممحاة"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-2xl border border-slate-700">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c.id)}
                className={`w-5 h-5 rounded-full transition transform active:scale-95 ${
                  selectedColor === c.id ? 'ring-2 ring-white scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.id }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-2xl border border-slate-700">
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.size}
                onClick={() => setStrokeWidth(sw.size)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition ${
                  strokeWidth === sw.size
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          {/* Actions: Undo, Redo, Clear, Save, Download, Fullscreen */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-xl transition"
              title="تراجع"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-xl transition"
              title="إعادة"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('هل تريد مسح كل ما تم رسمه على السبورة؟')) {
                  clearCanvas();
                }
              }}
              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-xl transition"
              title="مسح السبورة بالكامل"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {onSaveSnapshot && (
              <button
                onClick={handleSaveSnapshot}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition active:scale-95"
                title="حفظ السبورة لمشاركتها مع الطلاب"
              >
                {snapshotSaved ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : null}
                <span>{snapshotSaved ? 'تم الحفظ!' : 'حفظ'}</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl transition"
              title="تنزيل السبورة كصورة PNG"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl transition"
              title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative flex-1 bg-white overflow-hidden touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 block w-full h-full"
        />

        {readOnly && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-bold shadow-md pointer-events-none">
            🎨 وضع المشاهدة للسبورة
          </div>
        )}
      </div>
    </div>
  );
};

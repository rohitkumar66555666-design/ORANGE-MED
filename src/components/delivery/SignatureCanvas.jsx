// Digital signature canvas (mouse + touch). Emits a data URL to `onChange`.

import { useRef, useState } from 'react';

export function SignatureCanvas({ onChange, className = '' }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const start = (e) => {
    setDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
  };

  const move = (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    const data = canvas.toDataURL('image/png');
    onChange(data);
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={560}
        height={160}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        style={{ touchAction: 'none', cursor: 'crosshair' }}
        className={`border border-slate-300 rounded-xl bg-white ${className}`}
        aria-label="Customer signature canvas"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={clear}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
        >
          Clear
        </button>
        <button
          onClick={() => canvasRef.current && canvasRef.current.toDataURL('image/png')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          Done signing
        </button>
      </div>
    </div>
  );
}

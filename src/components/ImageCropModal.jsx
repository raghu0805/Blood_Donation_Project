import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, RotateCcw, Move } from 'lucide-react';

export default function ImageCropModal({ isOpen, imageSrc, onClose, onSave }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchDistRef = useRef(null);

  // Reset state when modal opens or imageSrc changes
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImgLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      img.onload = () => {
        imageRef.current = img;
        setImgLoaded(true);
      };
    }
  }, [isOpen, imageSrc]);

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    setPosition({ x: 0, y: 0 }); // reset pan position on rotate for clean fit
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Drag Handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers
  const getTouchDist = (e) => {
    if (e.touches.length < 2) return null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    } else if (e.touches.length === 2) {
      touchDistRef.current = getTouchDist(e);
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchDistRef.current) {
      const dist = getTouchDist(e);
      if (dist) {
        const ratio = dist / touchDistRef.current;
        setZoom(prev => Math.max(1, Math.min(3, parseFloat((prev * ratio).toFixed(2)))));
        touchDistRef.current = dist;
      }
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistRef.current = null;
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleMouseMove]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(prev => Math.max(1, Math.min(3, parseFloat((prev + delta).toFixed(2)))));
  };

  // Generate cropped image base64
  const handleCropSave = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const canvas = document.createElement('canvas');
    const CROP_SIZE = 512; // Output high-res profile size
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');

    // Get mask container dimensions (assumed square)
    const maskSize = 280; // size of the circle crop view in px

    ctx.save();

    // Clip canvas to a circular path
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Center output canvas
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate scaling to map preview container to output canvas
    const baseScale = CROP_SIZE / maskSize;
    const posX = position.x * baseScale;
    const posY = position.y * baseScale;

    // Determine intrinsic aspect scaling
    const isRotated90 = rotation === 90 || rotation === 270;
    const imgW = isRotated90 ? img.height : img.width;
    const imgH = isRotated90 ? img.width : img.height;

    const fitScale = Math.max(CROP_SIZE / imgW, CROP_SIZE / imgH);
    const drawW = img.width * fitScale;
    const drawH = img.height * fitScale;

    // Apply drag offset mapped according to rotation
    let rotAdjustedX = posX;
    let rotAdjustedY = posY;

    if (rotation === 90) {
      rotAdjustedX = posY;
      rotAdjustedY = -posX;
    } else if (rotation === 180) {
      rotAdjustedX = -posX;
      rotAdjustedY = -posY;
    } else if (rotation === 270) {
      rotAdjustedX = -posY;
      rotAdjustedY = posX;
    }

    ctx.drawImage(
      img,
      -drawW / 2 + rotAdjustedX / zoom,
      -drawH / 2 + rotAdjustedY / zoom,
      drawW,
      drawH
    );

    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);
    onSave(croppedBase64);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-hidden">
        
        {/* TOP BAR - WhatsApp style */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/80 border-b border-slate-800/80 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="Cancel"
            >
              <X size={22} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Drag to adjust photo
              </h2>
              <p className="text-xs text-slate-400">
                Pinch or scroll to zoom · Tap rotate to turn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw size={18} />
              <span className="hidden sm:inline">Rotate</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={18} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </header>

        {/* MAIN CROP CONTAINER */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Centered Image with Transforms */}
          {imgLoaded && (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="absolute pointer-events-none flex items-center justify-center"
            >
              <img
                src={imageSrc}
                alt="Crop viewport"
                className="max-w-none max-h-none object-contain select-none"
                style={{
                  width: '280px',
                  height: '280px',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}

          {/* Dark Translucent Mask overlay with WhatsApp circular cutout */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="relative w-[280px] h-[280px] rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] flex items-center justify-center"
            >
              {/* WhatsApp Grid lines when interacting */}
              <div className={`absolute inset-0 rounded-full grid grid-cols-3 grid-rows-3 transition-opacity duration-200 pointer-events-none ${isDragging ? 'opacity-40' : 'opacity-15'}`}>
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Center Move Icon Indicator */}
              <div className={`p-2.5 rounded-full bg-black/50 text-white backdrop-blur-xs transition-opacity duration-300 ${isDragging ? 'opacity-90 scale-110' : 'opacity-40 hover:opacity-80'}`}>
                <Move size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS BAR */}
        <footer className="px-4 sm:px-8 py-5 bg-slate-900/90 border-t border-slate-800/80 flex flex-col gap-4 z-20">
          
          {/* Zoom Slider */}
          <div className="max-w-md mx-auto w-full flex items-center gap-3 px-2">
            <button
              onClick={() => setZoom(prev => Math.max(1, parseFloat((prev - 0.1).toFixed(2))))}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <button
              onClick={() => setZoom(prev => Math.min(3, parseFloat((prev + 0.1).toFixed(2))))}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ZoomIn size={18} className="text-emerald-400" />
            </button>
            <span className="text-xs font-bold text-slate-400 min-w-[36px] text-right font-mono">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-md mx-auto w-full gap-4 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCropSave}
              className="flex-1 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition cursor-pointer"
            >
              <Check size={18} />
              Done
            </button>
          </div>
        </footer>

      </div>
    </AnimatePresence>
  );
}



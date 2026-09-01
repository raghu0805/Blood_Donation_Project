import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Grid } from 'lucide-react';
import { Button } from './Button';

const ALIGNMENT_GRID = [
    { id: 'top-left', label: 'Top Left', x: 0, y: 0 },
    { id: 'top-center', label: 'Top Center', x: 0.5, y: 0 },
    { id: 'top-right', label: 'Top Right', x: 1, y: 0 },
    { id: 'center-left', label: 'Center Left', x: 0, y: 0.5 },
    { id: 'center', label: 'Center', x: 0.5, y: 0.5 },
    { id: 'center-right', label: 'Center Right', x: 1, y: 0.5 },
    { id: 'bottom-left', label: 'Bottom Left', x: 0, y: 1 },
    { id: 'bottom-center', label: 'Bottom Center', x: 0.5, y: 1 },
    { id: 'bottom-right', label: 'Bottom Right', x: 1, y: 1 },
];

export default function ImageCropModal({ isOpen, imageSrc, onClose, onSave }) {
    const [zoom, setZoom] = useState(1);
    const [selectedPosition, setSelectedPosition] = useState('center');
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [previewUrl, setPreviewUrl] = useState('');

    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Reset crop state on open/imageSrc change
    useEffect(() => {
        if (isOpen && imageSrc) {
            setZoom(1);
            setSelectedPosition('center');
            setDragOffset({ x: 0, y: 0 });
            setImgLoaded(false);
            
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                imageRef.current = img;
                setImgLoaded(true);
            };
        }
    }, [isOpen, imageSrc]);

    // Crop rendering function
    const renderCrop = useCallback(() => {
        if (!imageRef.current || !canvasRef.current) return;
        const img = imageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const OUTPUT_SIZE = 300;
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;

        const imgWidth = img.width;
        const imgHeight = img.height;

        // Base side length of crop square (taking min dimension)
        const baseCropSize = Math.min(imgWidth, imgHeight);
        const actualCropSize = Math.max(50, baseCropSize / zoom);

        // Find position preset coords (0 to 1)
        const posObj = ALIGNMENT_GRID.find(p => p.id === selectedPosition) || ALIGNMENT_GRID[4];
        
        // Calculate crop top-left before drag
        const maxStartX = imgWidth - actualCropSize;
        const maxStartY = imgHeight - actualCropSize;

        let startX = maxStartX * posObj.x + dragOffset.x;
        let startY = maxStartY * posObj.y + dragOffset.y;

        // Clamp crop box within image boundaries
        startX = Math.max(0, Math.min(maxStartX, startX));
        startY = Math.max(0, Math.min(maxStartY, startY));

        ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        ctx.drawImage(
            img,
            startX, startY, actualCropSize, actualCropSize,
            0, 0, OUTPUT_SIZE, OUTPUT_SIZE
        );

        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
    }, [zoom, selectedPosition, dragOffset]);

    useEffect(() => {
        if (imgLoaded) {
            renderCrop();
        }
    }, [imgLoaded, renderCrop]);

    // Drag handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !imageRef.current) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        // Scale drag sensitivity according to image size
        const img = imageRef.current;
        const scaleFactor = Math.min(img.width, img.height) / 250;

        setDragOffset(prev => ({
            x: prev.x - dx * scaleFactor,
            y: prev.y - dy * scaleFactor
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setZoom(1);
        setSelectedPosition('center');
        setDragOffset({ x: 0, y: 0 });
    };

    const handleSave = () => {
        if (previewUrl) {
            onSave(previewUrl);
            onClose();
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-red-100 relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Select Profile Image Area</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Use the position table or drag & zoom to choose what to display.
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Interactive Canvas Preview & Drag Area */}
                    <div className="flex flex-col items-center gap-3">
                        <div 
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-2 border-red-500/30 shadow-lg group cursor-grab active:cursor-grabbing bg-slate-100 flex items-center justify-center"
                        >
                            {previewUrl ? (
                                <img 
                                    src={previewUrl} 
                                    alt="Crop Preview" 
                                    className="w-full h-full object-cover pointer-events-none select-none"
                                />
                            ) : (
                                <div className="animate-spin h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full" />
                            )}
                            
                            {/* Overlay Grid Guide */}
                            <div className="absolute inset-0 border border-white/40 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40 group-hover:opacity-80 transition-opacity">
                                <div className="border-r border-b border-white/30" />
                                <div className="border-r border-b border-white/30" />
                                <div className="border-b border-white/30" />
                                <div className="border-r border-b border-white/30" />
                                <div className="border-r border-b border-white/30" />
                                <div className="border-b border-white/30" />
                                <div className="border-r border-white/30" />
                                <div className="border-r border-white/30" />
                                <div />
                            </div>

                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Move size={10} /> Drag to reposition
                            </div>
                        </div>

                        {/* Hidden Canvas element used for crop rendering */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Zoom Control Slider */}
                        <div className="w-full max-w-xs px-2 flex items-center gap-3 mt-1">
                            <ZoomOut size={16} className="text-slate-400 shrink-0" />
                            <input 
                                type="range" 
                                min="1" 
                                max="3" 
                                step="0.05"
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                            <ZoomIn size={16} className="text-red-600 shrink-0" />
                        </div>
                    </div>

                    {/* 3x3 Position Selection Table */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Grid size={14} className="text-red-600" /> Focus Position Table
                            </label>
                            <button 
                                onClick={handleReset}
                                className="text-[11px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                            >
                                <RotateCcw size={12} /> Reset
                            </button>
                        </div>

                        {/* 3x3 Selection Grid Table */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                            {ALIGNMENT_GRID.map((pos) => {
                                const isSelected = selectedPosition === pos.id;
                                return (
                                    <button
                                        key={pos.id}
                                        onClick={() => {
                                            setSelectedPosition(pos.id);
                                            setDragOffset({ x: 0, y: 0 });
                                        }}
                                        className={`py-3 px-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                                            isSelected 
                                                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-transparent shadow-md shadow-red-500/20 scale-[1.03]' 
                                                : 'bg-white text-slate-700 hover:bg-red-50 hover:border-red-200 border-slate-200'
                                        }`}
                                    >
                                        <span>{pos.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <Button 
                        variant="secondary" 
                        onClick={onClose}
                        className="rounded-xl text-xs px-4"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave}
                        className="rounded-xl text-xs px-6 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white font-bold shadow-md hover:scale-105 transition-all"
                    >
                        <Check size={14} className="mr-1.5 inline" /> Apply Profile Image
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

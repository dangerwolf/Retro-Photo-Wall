import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PolaroidPhoto } from '../types';
import { Download, Loader2, X } from 'lucide-react';

interface PolaroidProps {
  photo: PolaroidPhoto;
  containerRef: React.RefObject<HTMLDivElement>;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export const Polaroid: React.FC<PolaroidProps> = ({ photo, containerRef, onDragEnd, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const downloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `polaroid-${photo.timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(photo.id);
  };

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      initial={{ 
        x: photo.x, 
        y: photo.y, 
        scale: 0.5, 
        opacity: 0, 
        rotate: 0 
      }}
      animate={{ 
        x: photo.x, 
        y: photo.y, 
        scale: 1, 
        opacity: 1,
        rotate: photo.rotation 
      }}
      exit={{ 
        scale: 0.8, 
        opacity: 0, 
        transition: { duration: 0.2 } 
      }}
      onDragEnd={(e, info) => {
        // Calculate position relative to parent to save state
        // In a real app, we might use getBoundingClientRect, 
        // but here we trust framer's offset for simplicity in visual placement
        onDragEnd(photo.id, photo.x + info.offset.x, photo.y + info.offset.y);
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="absolute cursor-move touch-none select-none z-20 pointer-events-auto"
      style={{ width: '240px' }}
    >
      <div className="bg-white p-3 pb-8 shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl relative">
        {/* Photo Area */}
        <div className="bg-gray-900 aspect-[4/5] w-full overflow-hidden relative mb-3">
          <img
            src={photo.imageUrl}
            alt="Memory"
            className={`w-full h-full object-cover ${photo.isDeveloping ? 'developing-photo' : ''}`}
            draggable={false}
          />
          
          {/* Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Caption Area */}
        <div className="h-8 flex items-center justify-center text-center">
          {photo.caption ? (
            <p className="handwritten text-gray-700 text-xl transform -rotate-1">
              {photo.caption}
            </p>
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Timestamp (Tiny) */}
        <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 font-mono">
          {new Date(photo.timestamp).toLocaleDateString()}
        </div>

        {/* Hover Controls */}
        {isHovered && (
          <>
            {/* Delete Button (Top Left) */}
            <button
              onClick={handleDelete}
              className="absolute -top-3 -left-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-transform hover:scale-110 z-30"
              title="Delete photo"
            >
              <X size={14} />
            </button>

            {/* Download Button (Top Right) */}
            <button
              onClick={downloadImage}
              className="absolute -top-3 -right-3 bg-gray-800 text-white p-2 rounded-full shadow-md hover:bg-gray-700 transition-transform hover:scale-110 z-30"
              title="Download raw image"
            >
              <Download size={14} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
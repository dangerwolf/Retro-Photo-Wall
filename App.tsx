import React, { useState, useRef } from 'react';
import { Camera } from './components/Camera';
import { Polaroid } from './components/Polaroid';
import { PolaroidPhoto } from './types';
import { generatePhotoCaption } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCapture = async (dataUrl: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // 1. Create the photo object immediately for the animation
    const newPhoto: PolaroidPhoto = {
      id: uuidv4(),
      imageUrl: dataUrl,
      timestamp: Date.now(),
      caption: "", // Empty initially
      x: 50, // Start near the camera ejection point relative to container
      y: window.innerHeight - 450, // Approximate top of camera
      rotation: (Math.random() - 0.5) * 10, // Random slight tilt
      isDeveloping: true,
    };

    // Add to state to trigger render
    setPhotos((prev) => [...prev, newPhoto]);

    // 2. Animate "Ejection" logic
    // We'll simulate the ejection by updating its position after a brief moment
    setTimeout(() => {
        setPhotos((prev) => prev.map(p => 
            p.id === newPhoto.id 
            ? { ...p, y: p.y - 200, x: p.x + (Math.random() * 50) } // Move up and slightly random X
            : p
        ));
    }, 100);

    // 3. Stop "developing" visual effect after 5 seconds
    setTimeout(() => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === newPhoto.id ? { ...p, isDeveloping: false } : p))
      );
      setIsProcessing(false);
    }, 3000); // Allow next shot sooner than full develop

    // 4. Fetch AI Caption in background
    try {
      const caption = await generatePhotoCaption(dataUrl);
      setPhotos((prev) =>
        prev.map((p) => (p.id === newPhoto.id ? { ...p, caption } : p))
      );
    } catch (e) {
      console.error("Failed to caption", e);
      setPhotos((prev) =>
        prev.map((p) => (p.id === newPhoto.id ? { ...p, caption: "Start of something new" } : p))
      );
    }
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    );
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div 
        ref={containerRef} 
        className="relative w-full h-screen overflow-hidden flex flex-col justify-between"
    >
      {/* Header / Instructions */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 rotate-2">
            <h1 className="text-xl font-bold text-gray-800 handwritten">My Photo Wall</h1>
        </div>
      </div>

      {/* Photo Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
         {/* The container is pointer-events-none so clicks pass through to background,
             but individual polaroids are pointer-events-auto */}
        <AnimatePresence>
          {photos.map((photo) => (
            <Polaroid
              key={photo.id}
              photo={photo}
              containerRef={containerRef}
              onDragEnd={handleDragEnd}
              onDelete={handleDeletePhoto}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Camera Layer (Fixed Bottom Left) */}
      <div className="absolute bottom-10 left-10 z-30">
        {/* Invisible slot animation helper could go here */}
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
        >
            <Camera onCapture={handleCapture} isProcessing={isProcessing} />
        </motion.div>
      </div>

      {/* Footer / Credits */}
      <div className="absolute bottom-2 right-4 text-gray-400 text-xs font-mono z-10">
        Powered by Gemini 2.5
      </div>
    </div>
  );
};

export default App;
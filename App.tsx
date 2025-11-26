import React, { useState, useRef, useEffect } from 'react';
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

  // Load photos from DB on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch('/api/photos');
        if (res.ok) {
          const data = await res.json();
          // Ensure retrieved photos are not in "developing" state
          const loadedPhotos = data.map((p: any) => ({
            ...p,
            isDeveloping: false
          }));
          setPhotos(loadedPhotos);
        }
      } catch (err) {
        console.error("Failed to load photos", err);
      }
    };
    fetchPhotos();
  }, []);

  const handleCapture = async (dataUrl: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const newId = uuidv4();
    const initialX = 50;
    const initialY = window.innerHeight - 450;
    const rotation = (Math.random() - 0.5) * 10;
    const timestamp = Date.now();

    // 1. Create the photo object immediately for the animation
    const newPhoto: PolaroidPhoto = {
      id: newId,
      imageUrl: dataUrl,
      timestamp: timestamp,
      caption: "", // Empty initially
      x: initialX, 
      y: initialY,
      rotation: rotation,
      isDeveloping: true,
    };

    // Add to state to trigger render
    setPhotos((prev) => [...prev, newPhoto]);

    // 2. Animate "Ejection" logic
    // We'll simulate the ejection by updating its position after a brief moment
    const finalX = initialX + (Math.random() * 50);
    const finalY = initialY - 200;

    setTimeout(() => {
        setPhotos((prev) => prev.map(p => 
            p.id === newPhoto.id 
            ? { ...p, y: finalY, x: finalX } // Move up and slightly random X
            : p
        ));
    }, 100);

    // 3. Stop "developing" visual effect after 5 seconds
    setTimeout(() => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === newPhoto.id ? { ...p, isDeveloping: false } : p))
      );
      setIsProcessing(false);
    }, 3000); 

    // 4. Fetch AI Caption in background AND Save to DB
    try {
      const caption = await generatePhotoCaption(dataUrl);
      
      // Update UI
      setPhotos((prev) =>
        prev.map((p) => (p.id === newPhoto.id ? { ...p, caption } : p))
      );

      // Save to Database
      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          imageUrl: dataUrl,
          timestamp,
          caption,
          x: finalX,
          y: finalY,
          rotation
        })
      });

    } catch (e) {
      console.error("Failed to caption or save", e);
      const fallbackCaption = "Start of something new";
      
      setPhotos((prev) =>
        prev.map((p) => (p.id === newPhoto.id ? { ...p, caption: fallbackCaption } : p))
      );

      // Save even if caption failed (with fallback)
      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          imageUrl: dataUrl,
          timestamp,
          caption: fallbackCaption,
          x: finalX,
          y: finalY,
          rotation
        })
      });
    }
  };

  const handleDragEnd = async (id: string, x: number, y: number) => {
    // Optimistic UI update
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x, y } : p))
    );

    // Persist position
    try {
      await fetch(`/api/photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });
    } catch (err) {
      console.error("Failed to save position", err);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    // Optimistic UI update
    setPhotos((prev) => prev.filter((p) => p.id !== id));

    // Delete from DB
    try {
      await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete photo", err);
    }
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
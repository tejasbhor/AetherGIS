import React, { useEffect, useRef, useState } from 'react';

interface EarthScrollSceneSimpleProps {
  onEnterDashboard?: () => void;
}

const EarthScrollSceneSimple: React.FC<EarthScrollSceneSimpleProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);

  // Load frames
  useEffect(() => {
    const loadFrames = async () => {
      const totalFrames = 300;
      const loadedFrames: HTMLImageElement[] = [];
      
      for (let i = 0; i < totalFrames; i++) {
        const frameNumber = i.toString().padStart(3, '0');
        const img = new Image();
        img.src = `/sequence/frame_${frameNumber}_delay-0.066s.webp`;
        
        await new Promise((resolve) => {
          img.onload = () => {
            loadedFrames.push(img);
            setLoadingProgress(Math.round(((loadedFrames.length) / totalFrames) * 100));
            resolve(true);
          };
          img.onerror = () => {
            setLoadingProgress(Math.round(((loadedFrames.length) / totalFrames) * 100));
            resolve(true); // Continue even if some frames fail
          };
        });
      }
      
      setFrames(loadedFrames);
      setIsLoading(false);
    };

    loadFrames();
  }, []);

  // Simple scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || frames.length === 0) return;
      
      const scrollTop = window.scrollY;
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = containerHeight - windowHeight;
      
      if (maxScroll <= 0) return;
      
      const scrollProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      const frameIndex = Math.floor(scrollProgress * (frames.length - 1));
      setCurrentFrame(frameIndex);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [frames]);

  // Render frame on canvas
  useEffect(() => {
    if (!canvasRef.current || frames.length === 0 || !frames[currentFrame]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = frames[currentFrame];
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, [currentFrame, frames]);

  if (isLoading) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: '#000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000 
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '2px solid rgba(255,255,255,0.1)', 
            borderTop: '2px solid #646cff', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading Earth sequence... {loadingProgress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '300vh' }}>
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        height: '100vh', 
        width: '100%', 
        overflow: 'hidden',
        background: '#000'
      }}>
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
        />
      </div>
    </div>
  );
};

export default EarthScrollSceneSimple;

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface EarthScrollSceneWorkingProps {
  onEnterDashboard?: () => void;
}

const EarthScrollSceneWorking: React.FC<EarthScrollSceneWorkingProps> = ({ onEnterDashboard }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);

  // Text sections for narrative
  const textSections = [
    { progress: 0, text: "Earth as It Is" },
    { progress: 0.25, text: "Seeing Through Time" },
    { progress: 0.45, text: "AI-Enhanced Vision" },
    { progress: 0.65, text: "Temporal Intelligence" },
    { progress: 0.85, text: "Beyond Reality" },
    { progress: 1.0, text: "Enter AetherGIS" }
  ];

  // Load frames
  useEffect(() => {
    const loadFrames = async () => {
      const totalFrames = 300;
      const loadedFrames: HTMLImageElement[] = [];
      let errorCount = 0;
      
      for (let i = 0; i < totalFrames; i++) {
        const frameNumber = i.toString().padStart(3, '0');
        const img = new Image();
        img.src = `/sequence/frame_${frameNumber}_delay-0.066s.webp`;
        
        try {
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              loadedFrames.push(img);
              setLoadingProgress(Math.round(((loadedFrames.length) / totalFrames) * 100));
              resolve();
            };
            img.onerror = () => {
              errorCount++;
              if (errorCount > totalFrames * 0.1) {
                setHasError(true);
              }
              resolve(); // Continue even if some frames fail
            };
            // Timeout after 5 seconds
            setTimeout(() => reject(new Error('Timeout')), 5000);
          });
        } catch (error) {
          console.error(`Frame ${i} failed to load:`, error);
          errorCount++;
        }
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [frames]);

  // Render frame on canvas
  const renderFrame = useCallback((index: number) => {
    if (!canvasRef.current || frames.length === 0 || !frames[index]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = frames[index];
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Cover the entire canvas while maintaining aspect ratio
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const x = (canvas.width - img.naturalWidth * scale) / 2;
    const y = (canvas.height - img.naturalHeight * scale) / 2;
    
    ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
  }, [frames]);

  // Update frame when scroll changes
  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, renderFrame]);

  // Calculate text opacity based on scroll progress
  const getTextOpacity = (sectionProgress: number) => {
    if (!containerRef.current) return 0;
    
    const scrollTop = window.scrollY;
    const containerHeight = containerRef.current.offsetHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = containerHeight - windowHeight;
    
    if (maxScroll <= 0) return 0;
    
    const currentProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    const diff = Math.abs(currentProgress - sectionProgress);
    
    if (diff < 0.05) return 1;
    if (diff < 0.1) return 0.8;
    if (diff < 0.15) return 0.4;
    return 0;
  };

  // Calculate UI transition opacity
  const getUITransitionOpacity = () => {
    if (!containerRef.current) return 0;
    
    const scrollTop = window.scrollY;
    const containerHeight = containerRef.current.offsetHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = containerHeight - windowHeight;
    
    if (maxScroll <= 0) return 0;
    
    const currentProgress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    
    if (currentProgress >= 0.85) {
      return Math.min((currentProgress - 0.85) * 6.67, 1); // Fade in from 85% to 100%
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading Earth sequence... {loadingProgress}%</p>
          <div className="loading-progress-bar">
            <div 
              className="loading-progress-fill" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="error-overlay">
        <div className="error-content">
          <h2>Unable to Load Animation</h2>
          <p>Some frames failed to load. The experience may be limited.</p>
          <button 
            className="error-continue-btn"
            onClick={() => setHasError(false)}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="earth-scroll-container">
      <div className="sticky-canvas-container">
        <canvas
          ref={canvasRef}
          className="earth-canvas"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            background: '#000',
            display: 'block'
          }}
        />
        
        {/* Text Overlays */}
        <div className="text-overlay-container">
          {textSections.map((section, index) => {
            const opacity = getTextOpacity(section.progress);
            const translateY = opacity === 0 ? 20 : 0;
            
            return (
              <div
                key={index}
                className="text-overlay"
                style={{
                  opacity,
                  transition: 'all 0.3s ease-out',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) translateY(${translateY}px)`
                }}
              >
                <h2 className="cinematic-text">{section.text}</h2>
                {section.progress === 1.0 && onEnterDashboard && (
                  <button 
                    className="cta-button"
                    onClick={onEnterDashboard}
                    style={{
                      opacity,
                      transform: `translateY(${translateY}px)`,
                      transition: 'all 0.3s ease-out',
                      marginTop: '2rem'
                    }}
                  >
                    Launch AetherGIS
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* UI Transition Overlay */}
        <div 
          className="ui-transition-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: getUITransitionOpacity(),
            transition: 'opacity 0.5s ease-out',
            pointerEvents: getUITransitionOpacity() > 0.5 ? 'auto' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)'
          }}
        >
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Dashboard Preview</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Ready to explore Earth's temporal intelligence?</p>
            {onEnterDashboard && (
              <button 
                className="cta-button"
                onClick={onEnterDashboard}
              >
                Enter AetherGIS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarthScrollSceneWorking;

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

function FlipNumber({ number }: { number: string }) {
  return (
    <div className="flip-card relative">
      <div className="bg-black border-t-2 border-gray-800 rounded-lg p-2 w-32 md:w-40 lg:w-48 h-full flex items-center justify-center">
        <span className="text-white">{number}</span>
      </div>
      <div className="flip-card-shadow absolute inset-x-0 h-1/2 bg-gradient-to-b from-black/50 to-transparent"></div>
    </div>
  );
}

function App() {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        
        // Check if device supports screen orientation API
        if (screen.orientation) {
          try {
            // Lock to landscape orientation
            await screen.orientation.lock('landscape');
          } catch (err) {
            console.log('Orientation lock not supported');
          }
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        
        // Unlock orientation when exiting fullscreen
        if (screen.orientation) {
          try {
            await screen.orientation.unlock();
          } catch (err) {
            console.log('Orientation unlock not supported');
          }
        }
      }
    } catch (err) {
      console.log('Fullscreen not supported');
    }
  };

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="h-full bg-gray-950 flex items-center justify-center relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleFullscreen}
          className="p-4 text-gray-400 hover:text-white transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 size={24} />
          ) : (
            <Maximize2 size={24} />
          )}
        </button>
      </div>
      
      <div className="clock-container p-12 rounded-3xl bg-black/80 shadow-2xl border border-gray-800">
        <div className="flex gap-2 sm:gap-4 items-center">
          <FlipNumber number={hours} />
          <div className="text-gray-500 text-4xl sm:text-6xl md:text-7xl lg:text-8xl animate-pulse">:</div>
          <FlipNumber number={minutes} />
          <div className="text-gray-500 text-4xl sm:text-6xl md:text-7xl lg:text-8xl animate-pulse">:</div>
          <FlipNumber number={seconds} />
        </div>
        <div className="mt-8 text-center text-gray-400 text-sm sm:text-xl font-light tracking-widest">
          {time.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export default App;
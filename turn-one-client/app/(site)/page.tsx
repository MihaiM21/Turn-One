"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, GaugeCircle } from "lucide-react";
import { Loading } from "@/components/ui/loading";

// Define the card data structure
type Card = {
  id: string;
  title: string;
  link: string;
  position: number; // Position for the background image
  comingSoon?: boolean; // Optional flag to show a "Coming Soon" label
};

// Single shared image for all cards (a modern F1 car)
const sharedBackgroundImage = "/turn-one-car/0001.webp";

// Sample card data - each with a different position to crop the image
const cards: Card[] = [
  {
    id: "home",
    title: "HOME",
    link: "/home",
    position: 5, // Left part of the image
    comingSoon: false,
  },
  {
    id: "dashboard",
    title: "DASHBOARD",
    link: "/dashboard",
    position: 35, // Left-middle part of the image
    comingSoon: false,
  },
  {
    id: "store",
    title: "STORE",
    link: "/store",
    position: 65, // Right-middle part of the image
    comingSoon: true,
  },
  {
    id: "telemetry",
    title: "TELEMETRY",
    link: "/telemetry",
    position: 95, // Right part of the image
    comingSoon: true,
  },
];

export default function HomePage() {
  const [activeCard, setActiveCard] = useState<number | null>(null); // No default card selected
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Preload the background image
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = sharedBackgroundImage;
      img.onload = () => setImageLoaded(true);
    }
  }, []);
  
  // Navigate to a specific card index
  const navigateToCard = (index: number) => {
    if (!containerRef.current) return;
    
    const safeIndex = Math.max(0, Math.min(cards.length - 1, index));
    
    if (safeIndex !== activeCard) {
      setActiveCard(safeIndex);
      
      const container = containerRef.current;
      const cardWidth = 264; // Fixed width of each card (240px + 24px margin)
      const targetScroll = safeIndex * cardWidth;
      
      setIsScrolling(true);
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      // Reset scrolling flag after animation completes
      setTimeout(() => setIsScrolling(false), 500);
      
      // Add subtle haptic feedback if browser supports it
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };
  
  // Handle wheel/scroll events for card navigation
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    // Avoid processing during ongoing scroll animation
    if (isScrolling) return;
    
    // Clear any existing timeout
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }
    
    // Debounce wheel events
    wheelTimeoutRef.current = setTimeout(() => {
      const direction = e.deltaY > 0 ? 1 : -1;
      navigateToCard(activeCard !== null ? activeCard + direction : 0);
    }, 50);
  };

  // Scroll handler to determine which card is centered
  const handleScroll = () => {
    if (!containerRef.current || isScrolling) return;
    
    const container = containerRef.current;
    const scrollPosition = container.scrollLeft;
    const containerWidth = container.offsetWidth;
    
    // Get the index of the card that's most centered in view
    const cardWidth = 264; // Fixed width of each card (240px + 24px margin)
    const centeredCardIndex = Math.round(scrollPosition / cardWidth);
    
    // Ensure valid card index
    const safeCardIndex = Math.max(0, Math.min(cards.length - 1, centeredCardIndex));
    
    // Only update if actually changed to avoid re-renders
    if (activeCard !== safeCardIndex) {
      setActiveCard(safeCardIndex);
      
      // Add subtle haptic feedback if browser supports it
      if (navigator.vibrate && window.innerWidth <= 768) {
        navigator.vibrate(5);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    // Left/right arrows for navigation
    if (e.key === "ArrowLeft") {
      navigateToCard(activeCard !== null ? activeCard - 1 : 0);
    } else if (e.key === "ArrowRight") {
      navigateToCard(activeCard !== null ? activeCard + 1 : 0);
    }
  };

  // Initialize and set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Passive: false allows us to preventDefault on wheel events
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("scroll", handleScroll);
      
      // Add keyboard navigation
      window.addEventListener("keydown", handleKeyDown);
      
      // Only detect the current card position if no card is active yet
      if (activeCard === null) {
        setTimeout(handleScroll, 100);
      }
    }
    
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("scroll", handleScroll);
      }
      
      window.removeEventListener("keydown", handleKeyDown);
      
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [activeCard, isScrolling]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-red-950 to-black text-white overflow-hidden">
      {/* Show loading screen until the image is loaded */}
      {!imageLoaded && <Loading message="Loading assets..." />}
      
      {/* Preload the shared background image with priority */}
      <div className="hidden">
        <Image 
          src={sharedBackgroundImage}
          priority
          alt="Preloaded F1 car"
          width={1200}
          height={800}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      
      {/* Header with logo */}
      
      {/* Main content area */}
      <div className="flex items-center justify-center flex-1">
      
      {/* Container to constrain width */}
      <div className="w-full max-w-7xl mx-auto px-8 relative flex items-center justify-center">
        {/* Navigation Buttons */}
        <motion.button 
          onClick={() => navigateToCard(activeCard !== null ? activeCard - 1 : 0)}
          disabled={activeCard === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-red-900/60 p-3 rounded-sm backdrop-blur-sm transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none border border-red-600/30 hover:border-red-500"
          aria-label="Previous card"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ChevronLeft size={24} className="text-red-100" />
        </motion.button>
        
        <motion.button 
          onClick={() => navigateToCard(activeCard !== null ? activeCard + 1 : 0)}
          disabled={activeCard === cards.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-red-900/60 p-3 rounded-sm backdrop-blur-sm transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none border border-red-600/30 hover:border-red-500"
          aria-label="Next card"
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.95 }}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ChevronRight size={24} className="text-red-100" />
        </motion.button>
        
        <div 
          ref={containerRef}
          className="w-full h-screen flex overflow-x-auto hide-scrollbar snap-x snap-mandatory justify-center items-center"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={(e) => {
            // Track mouse position for subtle parallax effect
            const containerWidth = e.currentTarget.offsetWidth;
            setMouseX(e.nativeEvent.offsetX / containerWidth);
          }}
        >
        {/* Tiny left margin for better aesthetics */}
        <div className="w-[4vw] flex-shrink-0" />
        
        {/* Cards */}
        {cards.map((card, index) => {
          const isActive = activeCard === index;
          
          return (
            <motion.div
              key={card.id}
              className="relative flex-shrink-0 snap-center cursor-pointer overflow-hidden group rounded-md"
              style={{ width: '240px', marginRight: '24px' }}
              animate={{
                height: isActive ? '75vh' : isHovering ? '65vh' : '70vh',
                opacity: isHovering && !isActive ? 0.6 : 1
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigateToCard(index)}
              whileHover={{
                scale: 1.02,
              }}
              layout
            >
              {/* Red accent border */}
              <motion.div
                className="absolute inset-x-0 h-1 bg-red-600 top-0 z-10"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: isActive ? 1 : 0,
                  opacity: isActive ? 1 : 0
                }}
                style={{ transformOrigin: "center" }}
              />
              
              {/* Image with different cropping for each card and subtle parallax */}
              <motion.div 
                className="absolute inset-0 bg-cover"
                animate={{
                  backgroundPosition: `${card.position + (mouseX * 5 - 2.5)}% center`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 20
                }}
                style={{ 
                  backgroundImage: imageLoaded ? `url(${sharedBackgroundImage})` : 'none',
                  filter: card.comingSoon 
                    ? isActive ? 'brightness(0.9) contrast(1.1) grayscale(0.3)' : 'brightness(0.6) contrast(0.9) grayscale(0.5)'
                    : isActive ? 'brightness(1.1) contrast(1.1)' : 'brightness(0.7) contrast(0.9)'
                }}
              />
              
              {/* Gradient overlay that changes when active */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t transition-opacity duration-300"
                animate={{
                  opacity: isActive ? 0.4 : 0.7,
                  background: isActive 
                    ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)' 
                    : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(153, 27, 27, 0.2) 100%)'
                }}
              />
              
              {/* Card title with animated position */}
              <motion.div
                className="absolute inset-x-0 px-4 py-3 flex flex-col items-center justify-center"
                animate={{
                  top: isActive ? 'auto' : '50%',
                  bottom: isActive ? '0' : 'auto',
                  y: isActive ? 0 : '-50%'
                }}
              >
                {isActive && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '40px' }}
                    className="h-[1px] bg-red-500 mb-2"
                    transition={{ delay: 0.2 }}
                  />
                )}
                <motion.span 
                  className="text-sm font-bold tracking-[0.2em] text-center"
                  animate={{
                    fontSize: isActive ? '1.1rem' : '0.875rem',
                    letterSpacing: isActive ? '0.25em' : '0.2em'
                  }}
                >
                  {card.title}
                </motion.span>
                
                {card.comingSoon && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[10px] mt-2 text-gray-300 font-medium"
                  >
                    COMING SOON
                  </motion.span>
                )}
              </motion.div>
              
              {/* View button - only visible on active card */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {card.comingSoon ? (
                  <div className="group relative px-8 py-3 bg-gray-700 overflow-hidden rounded-sm text-white text-sm font-medium tracking-wider cursor-not-allowed">
                    <span className="relative z-10">COMING SOON</span>
                  </div>
                ) : (
                  <Link 
                    href={card.link}
                    className="group relative px-8 py-3 bg-red-600 overflow-hidden rounded-sm text-white text-sm font-medium tracking-wider transition-all duration-300"
                  >
                    <span className="relative z-10">VIEW</span>
                    <motion.div 
                      className="absolute inset-0 bg-red-800"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  </Link>
                )}
              </motion.div>
              
              {/* Coming Soon badge */}
              {card.comingSoon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-sm tracking-wider transform rotate-3 z-20"
                >
                  SOON
                </motion.div>
              )}
              
              {/* Active indicator dots at bottom */}
              {isActive && (
                <motion.div 
                  className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {cards.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-red-500' : 'bg-gray-500'}`}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
        
        {/* Tiny right margin for better aesthetics */}
        <div className="w-[4vw] flex-shrink-0" />
      </div>
      
      {/* Audio visualizer effect at bottom */}
      <div className="fixed bottom-12 left-0 right-0 flex flex-col items-center z-20">
        <div className="flex space-x-1 mb-4">
          {[...Array(10)].map((_, i) => (
            <motion.div 
              key={i}
              className="h-[20px] w-[3px] bg-red-600"
              animate={{
                scaleY: [0.2, 0.8, 0.4, 1, 0.6, 0.3, 0.7, 0.2],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
        
        {/* Explanation text with improved animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <motion.p
            animate={{ 
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="text-xs text-white/90 tracking-[0.3em] font-medium"
          >
            SCROLL OR USE ARROWS TO EXPLORE
          </motion.p>
          <motion.div 
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-[1px] bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: "50%" }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />
        </motion.div>
      </div>
      
      {/* Custom CSS for hiding scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      </div>
      </div>
    </div>
  );
}
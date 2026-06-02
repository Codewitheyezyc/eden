export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 140 50" 
        className="h-full w-auto drop-shadow-sm"
      >
        {/* Text - adapts dynamically to light mode green (#1F7B00) and dark mode white */}
        <text 
          x="5" 
          y="42" 
          fontFamily="Georgia, 'Times New Roman', serif" 
          fontSize="46" 
          fontWeight="bold" 
          letterSpacing="-1.5"
          className="fill-[#1F7B00] dark:fill-white transition-colors"
        >
          Eden
        </text>
        
        {/* Main Leaf - Emerald green */}
        <path 
          d="M 85 24 Q 78 5 98 0 Q 110 5 95 24 Q 90 26 85 24 Z" 
          className="fill-[#10B981]" 
        />
        {/* Smaller Leaf - Soft gold/orange */}
        <path 
          d="M 86 24 Q 78 12 85 6 Q 95 6 92 14 Q 90 20 86 24 Z" 
          className="fill-[#F59E0B]" 
        />
      </svg>
    </div>
  );
}


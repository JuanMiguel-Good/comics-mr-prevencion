import React from 'react';
import { Vote, Clock, ChevronRight } from 'lucide-react';
import { useComics } from '../context/ComicsContext';

interface VotingBannerProps {
  onNavigateToWishlist: () => void;
}

export function VotingBanner({ onNavigateToWishlist }: VotingBannerProps) {
  const { activeRound, getTimeRemaining } = useComics();
  const timeRemaining = getTimeRemaining();

  // Debug logging
  console.log('VotingBanner Debug:', {
    activeRound: activeRound ? 'exists' : 'null',
    timeRemaining: timeRemaining ? 'exists' : 'null',
    endDate: activeRound?.endDate,
    now: new Date().toISOString()
  });

  if (!activeRound) {
    console.log('VotingBanner: No active round, not showing banner');
    return null;
  }

  if (!timeRemaining) {
    console.log('VotingBanner: No time remaining, round may have ended');
    return null;
  }

  const formatTime = (time: { days: number; hours: number; minutes: number; seconds: number }) => {
    const parts = [];
    if (time.days > 0) parts.push(`${time.days} día${time.days !== 1 ? 's' : ''}`);
    if (time.hours > 0) parts.push(`${time.hours} hora${time.hours !== 1 ? 's' : ''}`);
    if (time.minutes > 0) parts.push(`${time.minutes} minuto${time.minutes !== 1 ? 's' : ''}`);
    
    return parts.slice(0, 2).join(', ') || 'Menos de 1 minuto';
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg modern-font">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Vote className="h-6 w-6" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">¡Votación activa!</h3>
              <div className="flex items-center space-x-2 text-white/90">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  Faltan {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onNavigateToWishlist}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center space-x-2 border border-white/30"
          >
            <span>Ver temas y votar</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
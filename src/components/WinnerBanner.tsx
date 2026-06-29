import React from 'react';
import { Crown, CheckCircle, Calendar } from 'lucide-react';
import { WinnerTopic } from '../types';

interface WinnerBannerProps {
  winner: WinnerTopic;
}

export function WinnerBanner({ winner }: WinnerBannerProps) {
  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg modern-font">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Crown className="h-6 w-6" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">Tema ganador de la votación anterior</h3>
              <div className="flex items-center space-x-4 text-white/90">
                <span className="font-medium">"{winner.title}"</span>
                <span>•</span>
                <span>{winner.originalVotes} votos</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Ganó el {new Date(winner.winningDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 flex items-center space-x-2">
            {winner.status === 'winner' ? (
              <>
                <div className="animate-pulse">
                  <div className="w-4 h-4 bg-white/40 rounded-full"></div>
                </div>
                <span className="font-medium">En desarrollo</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Publicado</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
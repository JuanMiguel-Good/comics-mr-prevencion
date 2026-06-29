import React, { useState } from 'react';
import { Download, Star, MessageCircle, FileText, Image as ImageIcon, Calendar, TrendingUp, Eye, Crown } from 'lucide-react';
import { Comic } from '../types';
import { useAuth } from '../context/AuthContext';
import { useComics } from '../context/ComicsContext';

interface ComicCardProps {
  comic: Comic;
  onViewDetails: (comic: Comic) => void;
  onAuthClick: () => void;
}

export function ComicCard({ comic, onViewDetails, onAuthClick }: ComicCardProps) {
  const { user } = useAuth();
  const { downloadComic, rateComic, categories } = useComics();
  const [userRating, setUserRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf' || fileType === 'word') {
      return <FileText className="h-3 w-3" />;
    }
    return <ImageIcon className="h-3 w-3" />;
  };

  const handleDownload = () => {
    downloadComic(comic.id);
    window.open(comic.fileUrl, '_blank');
  };

  const handleRating = async (rating: number) => {
    console.log('handleRating called with rating:', rating);
    if (!user) {
      console.log('No user, opening auth modal');
      onAuthClick();
      return;
    }
    if (hasRated || isRating) {
      console.log('Already rated or currently rating');
      return;
    }
    
    setIsRating(true);
    console.log('Starting rating process...');
    
    try {
      console.log('Calling rateComic with:', { comicId: comic.id, rating, userId: user.id });
      const success = await rateComic(comic.id, rating, user.id);
      
      if (success) {
        console.log('Rating successful, updating local state');
        setUserRating(rating);
        setHasRated(true);
      } else {
        console.error('Rating failed');
      }
    } catch (error) {
      console.error('Error rating comic:', error);
    } finally {
      setIsRating(false);
      console.log('Rating process finished');
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        } ${
          interactive && !hasRated && !isRating && user
            ? 'cursor-pointer hover:text-yellow-400 transition-colors' 
            : interactive && (isRating || hasRated)
            ? 'opacity-50 cursor-wait' 
            : ''
        }`}
        onClick={() => interactive && !hasRated && !isRating && user && handleRating(i + 1)}
      />
    ));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || '';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#64748b';
  };

  return (
    <div className="gs-card overflow-hidden group modern-font">
      <div className="relative overflow-hidden">
        <img
          src={comic.coverImage}
          alt={comic.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badge especial para cómics de votación */}
        {comic.winningTopicId && (
          <div className="absolute top-0 left-0 bg-gradient-to-br from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-br-xl shadow-lg">
            <div className="flex items-center space-x-1">
              <Crown className="h-3 w-3" />
              <span className="text-xs font-bold uppercase">Por Votación</span>
            </div>
          </div>
        )}
        
        {/* File Type Badge */}
        <div className={`absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center space-x-1 shadow-sm ${
          comic.winningTopicId ? 'mt-12' : ''
        }`}>
          {getFileIcon(comic.fileType)}
          <span className="text-xs font-bold uppercase text-gray-700">
            {comic.fileType}
          </span>
        </div>
        
        {/* Categories */}
        <div className={`absolute ${comic.winningTopicId ? 'top-16' : 'top-3'} left-3 flex flex-wrap gap-1 max-w-[60%]`}>
          {comic.categories.slice(0, 3).map((categoryId) => (
            <span
              key={categoryId}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-white backdrop-blur-sm shadow-sm border border-white/20"
              style={{ backgroundColor: getCategoryColor(categoryId) }}
            >
              {getCategoryName(categoryId)}
            </span>
          ))}
          {comic.categories.length > 3 && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-800/90 text-white backdrop-blur-sm shadow-sm border border-white/20">
              +{comic.categories.length - 3}
            </span>
          )}
        </div>
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
      </div>

      <div className="p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {comic.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {comic.description}
        </p>
        
        {/* Información de votación si aplica */}
        {comic.winningTopicId && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Contenido solicitado por la comunidad
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            {renderStars(Math.round(comic.rating))}
            <span className="text-sm text-gray-600 ml-2">
              {comic.rating.toFixed(1)} ({comic.totalRatings})
            </span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <TrendingUp className="h-3 w-3" />
            <span className="text-sm">{comic.downloads}</span>
          </div>
        </div>
        
        {/* Additional category display in card body for mobile */}
        <div className="mb-4 flex flex-wrap gap-1 md:hidden">
          {comic.categories.map((categoryId) => (
            <span
              key={categoryId}
              className="text-xs font-medium px-2 py-1 rounded-md border"
              style={{ 
                backgroundColor: getCategoryColor(categoryId) + '15', 
                borderColor: getCategoryColor(categoryId) + '30',
                color: getCategoryColor(categoryId)
              }}
            >
              {getCategoryName(categoryId)}
            </span>
          ))}
        </div>

        {!hasRated && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-700 mb-2 font-medium">Calificar contenido</p>
            <div className="flex items-center justify-center space-x-1">
              {renderStars(userRating, true)}
              {isRating && (
                <div className="ml-2 text-xs text-blue-600">Guardando...</div>
              )}
            </div>
            {!user && (
              <p className="text-xs text-gray-500 mt-1">
                Inicia sesión para calificar
              </p>
            )}
          </div>
        )}
        
        {hasRated && (
          <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
            <p className="text-sm text-green-700 font-medium">¡Gracias por tu calificación!</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(comic.uploadDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-3 w-3" />
            <span className="text-gray-600">{comic.comments.length} comentarios</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="flex-1 gs-primary text-white font-medium"
          >
            <Download className="h-4 w-4" />
            <span>Descargar</span>
          </button>
          
          <button
            onClick={() => onViewDetails(comic)}
            className="flex-1 gs-secondary font-medium"
          >
            <Eye className="h-4 w-4" />
            <span>Ver Más</span>
          </button>
        </div>
      </div>
    </div>
  );
}
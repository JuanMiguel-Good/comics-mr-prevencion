import React, { useState } from 'react';
import { Search, FileText, Star, Plus, Calendar, ThumbsUp, Trash2, CheckCircle } from 'lucide-react';
import { useComics } from '../context/ComicsContext';
import { Comic } from '../types';
import { ComicCard } from './ComicCard';
import { ComicDetails } from './ComicDetails';
import { VotingBanner } from './VotingBanner';
import { WinnerBanner } from './WinnerBanner';
import { useAuth } from '../context/AuthContext';

interface ComicsGalleryProps {
  onAuthClick: () => void;
}

export function ComicsGallery({ onAuthClick }: ComicsGalleryProps) {
  const { user, isAdmin } = useAuth();
  const { comics, categories, wishlistTopics, activeRound, recentWinner, addWishlistTopic, voteWishlistTopic, deleteWishlistTopic, loading } = useComics();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'downloads'>('date');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showWishlist, setShowWishlist] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [submittingTopic, setSubmittingTopic] = useState(false);

  const filteredComics = comics
    .filter(comic => 
      comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comic.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(comic => 
      selectedCategory === '' || comic.categories.includes(selectedCategory)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'date':
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
    });

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTopicTitle.trim()) return;
    
    setSubmittingTopic(true);

    try {
      await addWishlistTopic({
        title: newTopicTitle.trim(),
        description: newTopicDescription.trim(),
        createdBy: user.id,
        createdByName: user.name
      });

      setNewTopicTitle('');
      setNewTopicDescription('');
      setShowAddTopic(false);
    } catch (error) {
      console.error('Error proposing topic:', error);
      alert('Error al proponer el tema. Intenta de nuevo.');
    } finally {
      setSubmittingTopic(false);
    }
  };

  const handleVote = (topicId: string) => {
    if (!user) {
      onAuthClick();
      return;
    }
    voteWishlistTopic(topicId, user.id).catch(error => {
      console.error('Error voting:', error);
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || '';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#64748b';
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 modern-font">
      {/* Voting Banner */}
      {activeRound && (
        <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
          <VotingBanner onNavigateToWishlist={() => setShowWishlist(true)} />
        </div>
      )}
      
      {/* Winner Banner */}
      {recentWinner && !activeRound && (
        <div className="-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
          <WinnerBanner winner={recentWinner} />
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contenido...</p>
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="card p-1 inline-flex">
          <button
            onClick={() => setShowWishlist(false)}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              !showWishlist 
                ? 'gs-primary' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Cómics Disponibles</span>
          </button>
          <button
            onClick={() => setShowWishlist(true)}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              showWishlist 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Star className="h-4 w-4" />
            <span>Lista de Deseos</span>
          </button>
        </div>
      </div>

      {!showWishlist ? (
        <>
          {/* Filters and Search */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cómics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field min-w-[180px]"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input-field min-w-[160px]"
                >
                  <option value="date">Más recientes</option>
                  <option value="rating">Mejor calificados</option>
                  <option value="downloads">Más descargados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comics Grid */}
          {filteredComics.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || selectedCategory ? 'No se encontraron resultados' : 'Contenido en desarrollo'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory
                  ? 'Intenta con otros términos de búsqueda o categorías' 
                  : 'Próximamente tendremos más contenido disponible'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComics.map((comic) => (
                <ComicCard
                  key={comic.id}
                  comic={comic}
                  onViewDetails={(comic) => setSelectedComic(comic)}
                  onAuthClick={onAuthClick}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Wishlist Section */
        <div className="space-y-6">
          <div className="text-center">
            <div className="card p-8 inline-block">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Lista de Deseos
              </h2>
              <p className="text-gray-600">
                ¡Vota por los próximos temas que te gustaría ver en cómic!
              </p>
            </div>
          </div>

          {/* Add Topic Button */}
          <div className="text-center py-16 card">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🌟 ¡Inicia la próxima votación!
            </h3>
            <p className="text-gray-600">
              Comparte tus ideas y ayúdanos a crear contenido que realmente necesitas
            </p>
          </div>

          {/* Add Topic Button */}
          <div className="text-center mb-6">
            {user ? (
              <button
                onClick={() => setShowAddTopic(true)}
                className="gs-success px-6 py-3 rounded-xl font-medium flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Proponer Tema</span>
              </button>
            ) : (
              <button
                onClick={onAuthClick}
                className="gs-primary px-6 py-3 rounded-xl font-medium flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Inicia sesión para proponer</span>
              </button>
            )}
          </div>

          {/* Add Topic Form */}
          {showAddTopic && user && (
            <div className="card p-6 mb-6">
              <form onSubmit={handleAddTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del tema
                  </label>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    className="input-field"
                    placeholder="Ej: Seguridad en espacios confinados"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newTopicDescription}
                    onChange={(e) => setNewTopicDescription(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Describe por qué sería útil este tema..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submittingTopic || !newTopicTitle.trim()}
                    className="gs-success px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {submittingTopic ? 'Enviando...' : 'Proponer Tema'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTopic(false)}
                    disabled={submittingTopic}
                    className="gs-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Wishlist Topics */}
          <div className="grid gap-4">
            {wishlistTopics
              .sort((a, b) => b.votes - a.votes)
              .map((topic) => (
                <div key={topic.id} className="card p-6 hover:border-gray-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {topic.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{topic.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Por {topic.createdByName}</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(topic.createdDate).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-blue-600">
                          {topic.votes}
                        </div>
                        <div className="text-xs text-gray-500">votos</div>
                      </div>
                      
                      <button
                        onClick={() => handleVote(topic.id)}
                        className={`p-3 rounded-lg font-medium transition-all ${
                          user && topic.voters.includes(user.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={!user ? 'Inicia sesión para votar' : 'Votar por este tema'}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      
                      {isAdmin && (
                        <button
                          onClick={() => deleteWishlistTopic(topic.id)}
                          className="bg-red-600 text-white p-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!user && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-700 text-center">
                        <button 
                          onClick={onAuthClick}
                          className="font-medium underline hover:no-underline text-blue-700"
                        >
                          Inicia sesión
                        </button>
                        <span className="text-blue-700"> para votar por este tema</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {wishlistTopics.length === 0 && (
            <div className="text-center py-16 card">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay temas propuestos aún
              </h3>
              <p className="text-gray-600">
                ¡Sé el primero en proponer un tema para el próximo cómic!
              </p>
            </div>
          )}
        </div>
      )}

      {selectedComic && (
        <ComicDetails
          comic={selectedComic}
          onClose={() => setSelectedComic(null)}
          onAuthClick={onAuthClick}
        />
      )}
    </div>
  );
}
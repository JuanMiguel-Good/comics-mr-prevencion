import React, { useState } from 'react';
import { X, Download, Star, MessageCircle, Send, Calendar, TrendingUp, FileText, Image, User } from 'lucide-react';
import { Comic, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useComics } from '../context/ComicsContext';

interface ComicDetailsProps {
  comic: Comic;
  onClose: () => void;
  onAuthClick: () => void;
}

export function ComicDetails({ comic, onClose, onAuthClick }: ComicDetailsProps) {
  const { user, isAdmin } = useAuth();
  const { addComment, deleteComment, downloadComic, categories } = useComics();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'opinion' | 'suggestion'>('opinion');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onAuthClick();
      return;
    }
    if (!newComment.trim()) return;

    addComment(comic.id, {
      userId: user.id,
      userName: user.name,
      content: newComment.trim(),
      type: commentType
    });

    setNewComment('');
  };

  const handleDownload = () => {
    downloadComic(comic.id);
    window.open(comic.fileUrl, '_blank');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf' || fileType === 'word') {
      return <FileText className="h-4 w-4" />;
    }
    return <Image className="h-4 w-4" />;
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden modern-font">
        <div className="modal-header-full">
          <h2 className="text-xl font-semibold">{comic.title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div>
              <img
                src={comic.coverImage}
                alt={comic.title}
                className="w-full h-64 object-cover rounded-xl"
              />
              
              {/* Categories */}
              <div className="mt-4 flex flex-wrap gap-2">
                {comic.categories.map((categoryId) => (
                  <span
                    key={categoryId}
                    className="text-sm font-medium px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: getCategoryColor(categoryId) }}
                  >
                    {getCategoryName(categoryId)}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(comic.fileType)}
                    <span className="font-medium text-gray-800">
                      {comic.fileType.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="gs-primary text-white px-6 py-3 rounded-xl font-medium gs-button flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descargar</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                    <div className="flex items-center justify-center space-x-1 text-green-700 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-semibold text-lg">{comic.downloads}</span>
                    </div>
                    <p className="text-xs text-green-700 font-medium">Descargas</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      {renderStars(Math.round(comic.rating))}
                    </div>
                    <p className="text-xs text-yellow-700 font-medium">
                      {comic.rating.toFixed(1)} ({comic.totalRatings} votos)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-gray-700 text-sm bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Publicado el {new Date(comic.uploadDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-gray-700 leading-relaxed">{comic.description}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="gs-primary p-2 rounded-xl">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Comentarios ({comic.comments.length})
                  </h3>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {!user && (
                    <div className="text-center">
                      <p className="text-gray-700 font-medium mb-2">Inicia sesión para comentar</p>
                      <p className="text-gray-600 text-sm">Necesitas una cuenta para dejar comentarios y calificaciones</p>
                      <button
                        onClick={onAuthClick}
                        className="mt-3 gs-primary text-white px-4 py-2 rounded-xl font-medium gs-button"
                      >
                        Iniciar Sesión
                      </button>
                    </div>
                  )}
                  
                  {user && (
                    <form onSubmit={handleSubmitComment}>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Tipo de comentario
                        </label>
                        <select
                          value={commentType}
                          onChange={(e) => setCommentType(e.target.value as 'opinion' | 'suggestion')}
                          className="modern-input"
                        >
                          <option value="opinion">Opinión</option>
                          <option value="suggestion">Sugerencia</option>
                        </select>
                      </div>
                      
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Escribe tu ${commentType === 'opinion' ? 'opinión' : 'sugerencia'}...`}
                        className="comment-textarea"
                        rows={3}
                      />
                      
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="mt-3 gs-primary disabled:opacity-50 px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>Enviar</span>
                      </button>
                    </form>
                  )}
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comic.comments.map((comment) => (
                    <div key={comment.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{comment.userName}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            comment.type === 'suggestion' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          } font-medium`}>
                            {comment.type === 'suggestion' ? 'Sugerencia' : 'Opinión'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">
                            {new Date(comment.date).toLocaleDateString()}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => deleteComment(comic.id, comment.id)}
                              className="gs-danger text-white text-xs font-medium px-2 py-1 rounded-lg gs-button"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  ))}
                  
                  {comic.comments.length === 0 && (
                    <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                      <p className="text-gray-600 font-medium text-lg mb-2">
                        No hay comentarios aún
                      </p>
                      <p className="text-gray-500">
                        {user ? 'Sé el primero en comentar' : 'Inicia sesión para comentar'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
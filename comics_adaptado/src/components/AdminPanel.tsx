import React, { useState } from 'react';
import { Plus, Upload, Edit, Trash2, FileText, Image, Calendar, TrendingUp, Save, X, Settings } from 'lucide-react';
import { useComics } from '../context/ComicsContext';
import { useAuth } from '../context/AuthContext';

export function AdminPanel() {
  const { comics, addComic, deleteComic, updateComic, categories, addCategory, updateCategory, deleteCategory, saving, winnerTopics } = useComics();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingComic, setEditingComic] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    categories: [] as string[]
  });
  const [newComic, setNewComic] = useState({
    title: '',
    description: '',
    coverImage: '',
    fileUrl: '',
    fileType: 'pdf' as const,
    categories: [] as string[]
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3b82f6',
    description: ''
  });
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    color: '#3b82f6',
    description: ''
  });
  const [selectedWinningTopic, setSelectedWinningTopic] = useState<string>('');

  // Función para detectar tipo de archivo
  const getFileType = (file: File): 'pdf' | 'word' | 'png' | 'jpg' => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'word';
      case 'png':
        return 'png';
      case 'jpg':
      case 'jpeg':
        return 'jpg';
      default:
        return 'pdf';
    }
  };

  // Función para validar archivo
  const validateFile = (file: File): string | null => {
    const maxSize = 30 * 1024 * 1024; // 30MB
    const allowedTypes = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedTypes.includes(extension)) {
      return 'Tipo de archivo no permitido. Solo PDF, Word, PNG, JPG.';
    }

    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. Máximo 30MB.';
    }

    return null;
  };

  // Manejar archivos seleccionados
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
    
    // Detectar tipo de archivo automáticamente
    const detectedType = getFileType(file);
    setNewComic(prev => ({
      ...prev,
      fileType: detectedType,
      fileUrl: URL.createObjectURL(file) // Para preview
    }));
  };

  // Eventos de drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Manejar click para seleccionar archivo
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setFileError('Debes estar autenticado para agregar cómics');
      return;
    }
    
    if (!newComic.title || !newComic.description || !selectedFile) {
      setFileError('Por favor completa todos los campos y selecciona un archivo');
      return;
    }

    addComic({
      ...newComic,
      coverImage: newComic.coverImage || 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400'
    }, selectedFile, user.id, selectedWinningTopic || undefined).then(() => {
      // Reset form only on success
      setNewComic({
        title: '',
        description: '',
        coverImage: '',
        fileUrl: '',
        fileType: 'pdf',
        categories: []
      });
      setSelectedWinningTopic('');
      setSelectedFile(null);
      setFileError('');
      setShowAddForm(false);
    }).catch((error) => {
      console.error('Error adding comic:', error);
      setFileError(`Error al guardar: ${error.message}`);
    });
  };


  const handleEditClick = (comic: any) => {
    setEditingComic(comic.id);
    setEditForm({
      title: comic.title,
      description: comic.description,
      coverImage: comic.coverImage,
      categories: comic.categories || []
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComic) return;

    updateComic(editingComic, editForm);
    setEditingComic(null);
    setEditForm({ title: '', description: '', coverImage: '', categories: [] });
  };

  const handleEditCancel = () => {
    setEditingComic(null);
    setEditForm({ title: '', description: '', coverImage: '', categories: [] });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    addCategory(newCategory);
    setNewCategory({ name: '', color: '#3b82f6', description: '' });
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditCategoryForm({
      name: category.name,
      color: category.color,
      description: category.description || ''
    });
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    updateCategory(editingCategory, editCategoryForm);
    setEditingCategory(null);
    setEditCategoryForm({ name: '', color: '#3b82f6', description: '' });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf' || fileType === 'word') {
      return <FileText className="h-4 w-4" />;
    }
    return <Image className="h-4 w-4" />;
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || '';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#64748b';
  };

  const handleCategoryToggle = (categoryId: string, isNewComic = false) => {
    if (isNewComic) {
      setNewComic(prev => ({
        ...prev,
        categories: prev.categories.includes(categoryId)
          ? prev.categories.filter(id => id !== categoryId)
          : [...prev.categories, categoryId]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        categories: prev.categories.includes(categoryId)
          ? prev.categories.filter(id => id !== categoryId)
          : [...prev.categories, categoryId]
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 modern-font">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-1">Gestiona el contenido de cómics SST</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="gs-secondary px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Categorías</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="gs-primary px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Cómic</span>
          </button>
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="modal-header-full">
              <h2 className="text-xl font-semibold">Gestionar Categorías</h2>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-4">Agregar Nueva Categoría</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      className="modern-input"
                      placeholder="Nombre de la categoría"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                      className="modern-input h-12"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    className="modern-input"
                    placeholder="Descripción de la categoría"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 gs-success text-white px-4 py-2 rounded-xl font-medium gs-button"
                >
                  Agregar Categoría
                </button>
              </form>

              {/* Categories List */}
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="gs-card p-4">
                    {editingCategory === category.id ? (
                      <form onSubmit={handleUpdateCategory} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editCategoryForm.name}
                            onChange={(e) => setEditCategoryForm({...editCategoryForm, name: e.target.value})}
                            className="modern-input"
                            placeholder="Nombre"
                            required
                          />
                          <input
                            type="color"
                            value={editCategoryForm.color}
                            onChange={(e) => setEditCategoryForm({...editCategoryForm, color: e.target.value})}
                            className="modern-input h-10"
                          />
                        </div>
                        <input
                          type="text"
                          value={editCategoryForm.description}
                          onChange={(e) => setEditCategoryForm({...editCategoryForm, description: e.target.value})}
                          className="modern-input"
                          placeholder="Descripción"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="gs-success px-3 py-1 rounded-lg text-sm font-medium"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="gs-secondary px-3 py-1 rounded-lg text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <span className="font-medium text-gray-900">{category.name}</span>
                            {category.description && (
                              <p className="text-sm text-gray-600">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="gs-accent p-2 rounded-lg"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
                                deleteCategory(category.id);
                              }
                            }}
                            className="gs-danger p-2 rounded-lg"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="gs-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agregar Nuevo Cómic</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={newComic.title}
                  onChange={(e) => setNewComic({...newComic, title: e.target.value})}
                  className="modern-input"
                  placeholder="Título del cómic"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de archivo
                </label>
                <select
                  value={newComic.fileType}
                  onChange={(e) => setNewComic({...newComic, fileType: e.target.value as any})}
                  className="modern-input"
                >
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={newComic.description}
                onChange={(e) => setNewComic({...newComic, description: e.target.value})}
                className="modern-input resize-none"
                rows={3}
                placeholder="Descripción del cómic"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id, true)}
                    className={`px-3 py-2 rounded-xl font-medium text-sm gs-button transition-all ${
                      newComic.categories.includes(category.id)
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={newComic.categories.includes(category.id) ? { backgroundColor: category.color } : {}}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Winner Topic Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema ganador (opcional)
              </label>
              <select
                value={selectedWinningTopic}
                onChange={(e) => setSelectedWinningTopic(e.target.value)}
                className="modern-input"
              >
                <option value="">-- Cómic normal (no por votación) --</option>
                {winnerTopics
                  .filter(topic => topic.status === 'winner')
                  .map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      🏆 {topic.title} ({topic.originalVotes} votos)
                    </option>
                  ))}
              </select>
              {selectedWinningTopic && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>📋 Nota:</strong> Este cómic será marcado como "Contenido solicitado por la comunidad" 
                    y el tema ganador cambiará a estado "Publicado".
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de imagen de portada
              </label>
              <input
                type="url"
                value={newComic.coverImage}
                onChange={(e) => setNewComic({...newComic, coverImage: e.target.value})}
                className="modern-input"
                placeholder="https://ejemplo.com/imagen.jpg (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo del cómic
              </label>
              
              {fileError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{fileError}</p>
                </div>
              )}
              
              {saving && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-600 font-medium">
                      Guardando cómic... Por favor espera.
                    </p>
                  </div>
                </div>
              )}
              
              <div 
                className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-green-600 font-medium">✓ {selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB - {newComic.fileType.toUpperCase()}
                    </p>
                    <p className="text-xs text-blue-600">Haz clic para cambiar archivo</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2 font-medium">
                      {isDragOver ? '¡Suelta el archivo aquí!' : 'Haz clic para seleccionar archivo o arrastra aquí'}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">PDF, Word, PNG, JPG (máx. 30MB)</p>
              </div>
              
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="gs-primary px-6 py-2 rounded-xl font-medium"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  'Agregar Cómic'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="gs-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 gs-primary">
          <h2 className="text-lg font-semibold text-white">Cómics Publicados ({comics.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cómic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categorías
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {comics.map((comic) => (
                <tr key={comic.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingComic === comic.id ? (
                      <form onSubmit={handleEditSubmit} className="space-y-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="Título"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                          placeholder="Descripción"
                        />
                        <input
                          type="url"
                          value={editForm.coverImage}
                          onChange={(e) => setEditForm({...editForm, coverImage: e.target.value})}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="URL de imagen"
                        />
                        <div className="flex flex-wrap gap-1">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => handleCategoryToggle(category.id)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium gs-button transition-all ${
                                editForm.categories.includes(category.id)
                                  ? 'text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              style={editForm.categories.includes(category.id) ? { backgroundColor: category.color } : {}}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="gs-success px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1"
                          >
                            <Save className="h-3 w-3" />
                            <span>Guardar</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleEditCancel}
                            className="gs-secondary px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <img
                          src={comic.coverImage}
                          alt={comic.title}
                          className="h-12 w-12 object-cover rounded-lg"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{comic.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{comic.description}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {comic.categories?.map((categoryId) => (
                        <span
                          key={categoryId}
                          className="text-xs font-medium px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: getCategoryColor(categoryId) }}
                        >
                          {getCategoryName(categoryId)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(comic.fileType)}
                      <span className="text-sm font-medium text-gray-700 uppercase">
                        {comic.fileType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span>{comic.downloads}</span>
                        </div>
                        <div>★ {comic.rating.toFixed(1)} ({comic.totalRatings})</div>
                        <div>{comic.comments.length} comentarios</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(comic.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditClick(comic)}
                        disabled={editingComic === comic.id}
                        className="gs-accent p-2 rounded-lg disabled:opacity-50"
                        title="Editar cómic"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        disabled={editingComic === comic.id}
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar este cómic?')) {
                            deleteComic(comic.id);
                          }
                        }}
                        className="gs-danger p-2 rounded-lg disabled:opacity-50"
                        title="Eliminar cómic"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComicsProvider } from './context/ComicsContext';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ComicsGallery } from './components/ComicsGallery';
import { AdminPanel } from './components/AdminPanel';

function AppContent() {
  const { user, isAdmin, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 modern-font">
        <Header onAuthClick={() => setShowAuth(true)} />
        
        <main>
          {isAdmin ? <AdminPanel /> : <ComicsGallery onAuthClick={() => setShowAuth(true)} />}
        </main>

        <footer className="footer-primary mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="mb-6">
                <a
                  href="https://chat.whatsapp.com/EKFhtd2gUJVLur4hvloEGb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Únete a la comunidad</span>
                </a>
              </div>
              
              <p className="font-semibold text-lg text-white">
                © 2025 Good Solutions
              </p>
              <p className="text-sm text-white opacity-90 mt-2">
                Promoviendo la seguridad y salud laboral a través del contenido visual<br/>
                Creando lugares de trabajo más seguros
              </p>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ComicsProvider>
        <AppContent />
      </ComicsProvider>
    </AuthProvider>
  );
}

export default App;
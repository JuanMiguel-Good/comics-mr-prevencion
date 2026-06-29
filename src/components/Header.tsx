import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onAuthClick: () => void;
}

export function Header({ onAuthClick }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 modern-font">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo fondo blanco.png" 
              alt="Good Solutions" 
              className="h-10 w-auto"
            />
            <div className="border-l border-gray-200 pl-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Cómics SST
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 text-dark">
                      {user.name}
                    </span>
                    {isAdmin && (
                      <span className="block text-xs font-medium text-primary">
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="gs-primary flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Acceder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
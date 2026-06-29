import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, AlertCircle, Globe, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const countries = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
  { code: '+51', country: 'PE', flag: '🇵🇪' },
  { code: '+56', country: 'CL', flag: '🇨🇱' },
  { code: '+58', country: 'VE', flag: '🇻🇪' },
  { code: '+593', country: 'EC', flag: '🇪🇨' },
  { code: '+591', country: 'BO', flag: '🇧🇴' },
  { code: '+595', country: 'PY', flag: '🇵🇾' },
  { code: '+598', country: 'UY', flag: '🇺🇾' },
];

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    whatsapp: '',
    countryCode: '+57'
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (isOpen && !isLogin) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let detectedCode = '+57';
      
      if (timezone.includes('America/Mexico')) detectedCode = '+52';
      else if (timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles')) detectedCode = '+1';
      else if (timezone.includes('America/Argentina')) detectedCode = '+54';
      else if (timezone.includes('America/Lima')) detectedCode = '+51';
      else if (timezone.includes('America/Santiago')) detectedCode = '+56';
      else if (timezone.includes('America/Caracas')) detectedCode = '+58';
      else if (timezone.includes('Europe/Madrid')) detectedCode = '+34';
      
      setRegisterData(prev => ({ ...prev, countryCode: detectedCode }));
    }
  }, [isOpen, isLogin]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        onClose();
        setLoginData({ email: '', password: '' });
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
      setError('Nombre y apellido son obligatorios');
      setLoading(false);
      return;
    }

    if (!registerData.email.includes('@')) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (registerData.whatsapp.length < 7) {
      setError('Número de WhatsApp inválido');
      setLoading(false);
      return;
    }

    try {
      const result = await register(registerData);
      
      if (result) {


        setSuccessMessage(JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          whatsapp: `${registerData.countryCode}${registerData.whatsapp}`
        }));
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError('Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden modern-font">
        <div className="modal-header flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isLogin ? 'bg-white/20' : 'bg-white/20'
            }`}>
              {isLogin ? <LogIn className="h-5 w-5 text-white" /> : <UserPlus className="h-5 w-5 text-white" />}
            </div>
            <h2 className="text-xl font-semibold text-white">
              {isLogin ? 'Iniciar Sesión' : 'Registro'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="modal-content p-6">
            <div className="flex mb-6 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  isLogin 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !isLogin 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Registrarse
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium text-red-600">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 p-3 rounded-xl border border-green-100 mb-4 text-center">
                <p className="text-green-800 font-medium">Procesando registro...</p>
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="input-field pl-10"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="input-field pl-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 text-white font-medium"
                >
                  {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>

              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                      className="input-field"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                      className="input-field"
                      placeholder="Tu apellido"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="input-field pl-10"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="input-field pl-10"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Elige una contraseña segura de al menos 6 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={registerData.countryCode}
                      onChange={(e) => setRegisterData({...registerData, countryCode: e.target.value})}
                      className="input-field"
                      style={{ minWidth: '90px', maxWidth: '120px' }}
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={registerData.whatsapp}
                        onChange={(e) => setRegisterData({...registerData, whatsapp: e.target.value})}
                        className="input-field pl-10"
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 gs-button"
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>

                <div className="text-center text-xs text-gray-600 mt-4 p-3 bg-gray-50 rounded-xl">
                  <Globe className="h-4 w-4 mx-auto mb-1" />
                  <p>Tu país fue detectado automáticamente. Puedes cambiarlo si es necesario.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden modern-font">
            <div className="bg-green-600 text-white p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold">¡Registro Exitoso!</h3>
              <p className="text-sm mt-1 opacity-90">Tus datos de acceso:</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {(() => {
                let data;
                try {
                  data = JSON.parse(successMessage);
                } catch {
                  data = { email: '', password: '', whatsapp: '' };
                }
                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">USUARIO (Email):</span>
                      </div>
                      <p className="text-lg font-bold text-blue-800 break-all bg-white px-3 py-2 rounded-lg border">
                        {data.email}
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lock className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">CONTRASEÑA:</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-800 bg-white px-3 py-2 rounded-lg border font-mono">
                        {data.password}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">WhatsApp:</span>
                      </div>
                      <p className="text-lg font-bold text-green-800 bg-white px-3 py-2 rounded-lg border">
                        {data.whatsapp}
                      </p>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">¡IMPORTANTE!</span>
                      </div>
                      <p className="text-sm text-red-700">
                        Guarda estos datos en un lugar seguro.<br/>
                        Los necesitarás para iniciar sesión.
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowSuccessModal(false);
                        onClose(); // ¡CERRAR TAMBIÉN EL MODAL PRINCIPAL!
                        setRegisterData({
                          firstName: '',
                          lastName: '',
                          email: '',
                          password: '',
                          whatsapp: '',
                          countryCode: '+57'
                        });
                        setSuccessMessage('');
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      Entendido, cerrar
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
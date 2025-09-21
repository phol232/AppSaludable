import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthUser, UserLogin, UserRegister, UserResponse } from '../types/api';
import { apiService } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: UserLogin) => Promise<{ success: boolean; error?: string }>;
  beginGoogleLogin: (redirectTo?: string) => void;
  register: (userData: UserRegister, roleCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  googleAuthError: string | null;
  clearGoogleAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get('google_token');
    const tokenTypeParam = url.searchParams.get('token_type');
    const errorFromUrl = url.searchParams.get('google_error');

    if (errorFromUrl) {
      setGoogleAuthError(errorFromUrl);
    }

    if (tokenFromUrl) {
      apiService.setToken(tokenFromUrl);
    }

    if (tokenFromUrl || tokenTypeParam || errorFromUrl) {
      url.searchParams.delete('google_token');
      url.searchParams.delete('token_type');
      url.searchParams.delete('google_error');
      const cleanedPath = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, document.title, cleanedPath);
    }
  }, []);

  // Verificar token y obtener el perfil real del usuario al cargar
  useEffect(() => {
    const bootstrap = async () => {
      const token = apiService.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await apiService.getProfile();
        if (me.success && me.data) {
          const u = me.data as unknown as UserResponse;
          setUser({
            usr_id: u.usr_id,
            usr_usuario: u.usr_usuario,
            usr_correo: u.usr_correo,
            usr_nombre: u.usr_nombre,
            usr_apellido: u.usr_apellido,
            rol_id: u.rol_id,
            avatar_url: u.avatar_url,
            token,
          });
        } else {
          // Fallback: decodificar JWT para al menos tener usuario
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            usr_id: 0,
            usr_usuario: payload.sub || '',
            usr_correo: '',
            usr_nombre: '',
            usr_apellido: '',
            rol_id: 0,
            token,
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
        apiService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (userData: UserLogin): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await apiService.login(userData);
      
      if (response.success && response.data) {
        const token = response.data.access_token;
        apiService.setToken(token);
        
        // Obtener el perfil real inmediatamente después del login
        const me = await apiService.getProfile();
        if (me.success && me.data) {
          const u = me.data as unknown as UserResponse;
          setUser({
            usr_id: u.usr_id,
            usr_usuario: u.usr_usuario || userData.usuario,
            usr_correo: u.usr_correo,
            usr_nombre: u.usr_nombre,
            usr_apellido: u.usr_apellido,
            rol_id: u.rol_id,
            avatar_url: u.avatar_url,
            token,
          });
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Error en el login' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const beginGoogleLogin = (redirectOverride?: string) => {
    setGoogleAuthError(null);
    const target = redirectOverride 
      || import.meta.env.VITE_GOOGLE_POST_LOGIN_REDIRECT 
      || window.location.origin;
    const authorizationUrl = apiService.getGoogleAuthStartUrl(target);
    window.location.href = authorizationUrl;
  };

  const register = async (userData: UserRegister, roleCode: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const registerPayload: UserRegister = {
        ...userData,
        rol_nombre: roleCode === 'TUTOR' ? userData.rol_nombre : 'TUTOR',
      };

      const response = await apiService.register(registerPayload);
      
      if (response.success && response.data) {
        const token = response.data.access_token;
        apiService.setToken(token);
        
        // Obtener perfil completo y aplicar cambio de rol si corresponde
        let profile: UserResponse | null = null;
        const profileResponse = await apiService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          profile = profileResponse.data;

          if (roleCode && roleCode !== 'TUTOR' && profile.usr_id) {
            try {
              const roleChange = await apiService.changeUserRole(profile.usr_id, { rol_codigo: roleCode });
              if (roleChange.success) {
                const refreshedProfile = await apiService.getProfile();
                if (refreshedProfile.success && refreshedProfile.data) {
                  profile = refreshedProfile.data;
                }
              }
            } catch (error) {
              console.error('No se pudo asignar el rol seleccionado:', error);
            }
          }
        }

        if (profile) {
          setUser({
            usr_id: profile.usr_id,
            usr_usuario: profile.usr_usuario || userData.usuario,
            usr_correo: profile.usr_correo,
            usr_nombre: profile.usr_nombre,
            usr_apellido: profile.usr_apellido,
            rol_id: profile.rol_id,
            avatar_url: profile.avatar_url,
            token,
          });
        } else {
          // Fallback en caso no se pueda obtener el perfil
          setUser({
            usr_id: 0,
            usr_usuario: userData.usuario,
            usr_correo: userData.correo,
            usr_nombre: userData.nombres,
            usr_apellido: userData.apellidos,
            rol_id: 0,
            token,
          });
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Error en el registro' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Intentar hacer logout en el backend
      await apiService.logout();
    } catch (error) {
      console.error('Error en logout del backend:', error);
      // Continuar con el logout local incluso si falla el backend
    } finally {
      // Siempre limpiar el estado local
      apiService.removeToken();
      setUser(null);
    }
  };

  const clearGoogleAuthError = useCallback(() => {
    setGoogleAuthError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    beginGoogleLogin,
    register,
    logout,
    isAuthenticated: !!user,
    googleAuthError,
    clearGoogleAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

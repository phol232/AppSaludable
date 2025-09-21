import { useCallback } from 'react';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

export const useGoogleSignIn = () => {
  const signInWithGoogle = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google SDK no está cargado'));
        return;
      }

      // Configuración del cliente de Google
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1088968007866-45kub2oqk3i5u63l1oh48q9uv0i1hm9u.apps.googleusercontent.com',
        callback: (response) => {
          resolve(response.credential);
        }
      });

      // Mostrar el popup de Google Sign-In
      window.google.accounts.id.prompt();
    });
  }, []);

  return { signInWithGoogle };
};

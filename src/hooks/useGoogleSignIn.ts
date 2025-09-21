import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: 'popup' | 'redirect';
            context?: 'signin';
            itp_support?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client';
let googleSdkLoader: Promise<void> | null = null;

const loadGoogleSdk = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In no está disponible en este entorno'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleSdkLoader) {
    googleSdkLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GOOGLE_SDK_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services')));
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_SDK_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  return googleSdkLoader;
};

export const useGoogleSignIn = () => {
  const [sdkReady, setSdkReady] = useState<boolean>(() => Boolean(window.google?.accounts?.id));
  const mountedRef = useRef(true);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    mountedRef.current = true;

    if (!sdkReady) {
      loadGoogleSdk()
        .then(() => {
          if (mountedRef.current) {
            setSdkReady(Boolean(window.google?.accounts?.id));
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [sdkReady]);

  const signInWithGoogle = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!clientId) {
        reject(new Error('Falta configurar VITE_GOOGLE_CLIENT_ID en el frontend'));
        return;
      }

      const invokePrompt = () => {
        const accounts = window.google?.accounts?.id;
        if (!accounts) {
          reject(new Error('Google Identity Services no está disponible'));
          return;
        }

        let settled = false;

        accounts.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: ({ credential }) => {
            if (settled) {
              return;
            }
            if (!credential) {
              settled = true;
              reject(new Error('Google no entregó credenciales'));
              return;
            }
            settled = true;
            resolve(credential);
          },
        });

        accounts.prompt((notification) => {
          if (settled) {
            return;
          }

          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            settled = true;
            const detail = notification.isNotDisplayed()
              ? notification.getNotDisplayedReason()
              : notification.getSkippedReason();
            reject(new Error(`Google Sign-In no se pudo mostrar (${detail || 'motivo desconocido'})`));
          }
        });
      };

      if (!sdkReady) {
        loadGoogleSdk()
          .then(() => {
            if (!mountedRef.current) {
              reject(new Error('La vista se desmontó antes de iniciar sesión con Google'));
              return;
            }
            setSdkReady(Boolean(window.google?.accounts?.id));
            invokePrompt();
          })
          .catch((error) => {
            reject(error instanceof Error ? error : new Error('No se pudo cargar Google Sign-In'));
          });
        return;
      }

      invokePrompt();
    });
  }, [clientId, sdkReady]);

  return { signInWithGoogle };
};

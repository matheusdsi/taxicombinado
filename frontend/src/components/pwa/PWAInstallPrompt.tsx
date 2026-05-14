'use client';

import { useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'taxi-combinado-install-dismissed';

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const canInstall = Boolean(installPrompt);
  const shouldShowIosHelp = isIos && !isStandalone;

  const text = useMemo(() => {
    if (canInstall) {
      return 'Instale o Táxi Combinado no seu celular e acesse mais rápido.';
    }

    return 'Toque em compartilhar e escolha "Adicionar à Tela de Início".';
  }, [canInstall]);

  useEffect(() => {
    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    };

    if ('serviceWorker' in navigator) {
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker, { once: true });
      }
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const appleDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    setIsStandalone(standalone);
    setIsIos(appleDevice);

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === 'true';
    if (dismissed || standalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsVisible(false);
      window.localStorage.setItem(DISMISS_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (appleDevice) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('load', registerServiceWorker);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isVisible || isStandalone || (!canInstall && !shouldShowIosHelp)) return null;

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    }

    setIsVisible(false);
  };

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-[76px] z-50 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-3 shadow-lg sm:bottom-5">
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">{text}</p>
          {canInstall && (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-3 rounded-xl bg-taxi-500 px-4 py-2 text-sm font-extrabold text-gray-950 shadow-sm transition hover:bg-taxi-600"
            >
              Instalar app
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar aviso de instalação"
          className="rounded-full px-2 py-1 text-lg leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          x
        </button>
      </div>
    </div>
  );
}

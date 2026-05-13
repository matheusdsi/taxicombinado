'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { driver, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-sem-fundo.png"
            alt="Taxi Combinado"
            width={100}
            height={100}
            className="object-contain"
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
          <Link
            href="/agendar"
            className="text-xs text-taxi-600 font-semibold hover:text-taxi-800 transition-colors hidden sm:block"
          >
            Agendar corrida
          </Link>
          {!loading && (
            driver ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs text-gray-400 max-w-[130px] truncate">
                  Olá, {driver.name || driver.email.split('@')[0]}
                </span>
                <Link
                  href="/minha-conta"
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Minha conta
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/entrar"
                  className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-xs bg-taxi-500 text-white px-3 py-1.5 rounded-full hover:bg-taxi-600 transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

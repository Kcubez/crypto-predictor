'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TrendingUp, History, Home, LogOut, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { usePrediction } from '@/contexts/prediction-context';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isPredicting } = usePrediction();

  useEffect(() => {
    // Fetch current user
    setLoading(true);
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [pathname]); // Re-fetch when pathname changes

  const handleLogout = async () => {
    // Clear localStorage to prevent data leaking between users
    localStorage.removeItem('btc_prediction');
    localStorage.removeItem('btc_prediction_tracking');
    localStorage.removeItem('gemini_api_key');

    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/predict', label: 'Predict', icon: TrendingUp },
    { href: '/history', label: 'History', icon: History },
  ];

  // Add admin link if user is admin
  const adminLinks =
    user?.role === 'admin'
      ? [{ href: '/admin/predict', label: 'Admin Predict', icon: Settings }]
      : [];

  const allLinks = [...links, ...adminLinks];

  // Hide navigation on login page
  const isLoginPage = pathname === '/login';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">
              BTC Predictor
            </span>
          </Link>

          {/* Navigation Links - Hidden on login page */}
          {!isLoginPage && (
            <div className="flex items-center gap-1">
              {allLinks.map(link => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                const isDisabled = isPredicting && (link.href === '/' || link.href === '/history');

                return (
                  <Link
                    key={link.href}
                    href={isDisabled ? '#' : link.href}
                    onClick={e => {
                      if (isDisabled) {
                        e.preventDefault();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all relative',
                      isDisabled
                        ? 'text-gray-600 cursor-not-allowed opacity-50'
                        : isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{link.label}</span>
                    {isActive && !isDisabled && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-purple-500 to-pink-500 rounded-full" />
                    )}
                  </Link>
                );
              })}

              {/* User Menu */}
              {!loading && user && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300 hidden md:inline">
                      {user.name || user.email}
                    </span>
                    {user.role === 'admin' && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

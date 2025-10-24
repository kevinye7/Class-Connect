'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (userData && isLoggedIn === 'true') {
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userCourses');
    setUser(null);
    router.push('/');
  };

  // Don't show nav on landing page
  const isLandingPage = pathname === '/';

  return (
    <html lang="en">
      <body className="min-h-screen">
        {!isLandingPage && (
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CC</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">ClassConnect</h1>
                </div>
                
                <div className="flex items-center space-x-8">
                  {user && (
                    <>
                      <a href="/dashboard" className={`text-gray-700 hover:text-blue-600 transition-colors font-medium ${pathname === '/dashboard' ? 'text-blue-600' : ''}`}>
                        Dashboard
                      </a>
                      <a href="/courses" className={`text-gray-700 hover:text-blue-600 transition-colors font-medium ${pathname === '/courses' ? 'text-blue-600' : ''}`}>
                        Courses
                      </a>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 hidden sm:block">
                          {user.email}
                        </span>
                        <button
                          onClick={handleLogout}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
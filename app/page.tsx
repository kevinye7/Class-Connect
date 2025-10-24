'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const validateCUNYEmail = (email: string): boolean => {
    const cunyDomains = [
      'cuny.edu',
      'qmail.cuny.edu',
      'mail.cuny.edu',
      'bbmail.cuny.edu',
      'gc.cuny.edu',
      'cc.cuny.edu',
      'bmcc.cuny.edu',
      'bcc.cuny.edu',
      'baruch.cuny.edu',
      'brooklyn.cuny.edu',
      'citytech.cuny.edu',
      'citycollege.cuny.edu',
      'hunter.cuny.edu',
      'johnjay.cuny.edu',
      'lehman.cuny.edu',
      'medgar.cuny.edu',
      'qcc.cuny.edu',
      'qc.cuny.edu',
      'york.cuny.edu',
      'law.cuny.edu',
      'sps.cuny.edu'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return cunyDomains.includes(domain || '');
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!validateCUNYEmail(email)) {
      setError('Please use a valid CUNY email address');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify({ email }));
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/dashboard');
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setEmail('');
    setError('');
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">CC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ClassConnect
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <button 
                onClick={openLoginModal}
                className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Student Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          {/* Background Decoration */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Connect with Your
              <span className="block bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CUNY Classmates
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Automatically generated class group chats for every course. 
              No more searching for WhatsApp groups—just focus on learning together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={openLoginModal}
                className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Get Started - It's Free
              </button>
              <a 
                href="#features"
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Active Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">10K+</div>
                <div className="text-gray-600">CUNY Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600">Collaboration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why ClassConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Designed specifically for CUNY students to enhance collaboration and communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Automatic Chat Creation</h3>
              <p className="text-gray-600 leading-relaxed">
                No more manual group creation. ClassConnect automatically generates dedicated chat rooms for every course at CUNY.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">CUNY-Only Access</h3>
              <p className="text-gray-600 leading-relaxed">
                Secure platform exclusively for CUNY students. Verify your identity with your CUNY email and connect with real classmates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-time Collaboration</h3>
              <p className="text-gray-600 leading-relaxed">
                Instant messaging, file sharing, and group discussions. Never miss important class updates or study sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Updated without "CUNY Collaboration Platform" */}
      <footer className="bg-linear-to-br from-blue-50 via-white to-indigo-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">CC</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">ClassConnect</h3>
              </div>
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 ClassConnect. Built for CUNY students.
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Enhanced backdrop with stronger blur */}
          <div 
            className="fixed inset-0 bg-opacity-60 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeLoginModal}
          ></div>
          
          {/* Modal content */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100 relative z-50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CC</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Welcome Back</h3>
                  <p className="text-sm text-gray-500">Sign in to ClassConnect</p>
                </div>
              </div>
              <button
                onClick={closeLoginModal}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-2">
                    CUNY Email Address
                  </label>
                  <input
                    id="modal-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="first.last@cuny.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to ClassConnect'
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 text-center">
                  <strong>Demo:</strong> Use any email ending with @cuny.edu
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
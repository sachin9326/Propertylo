import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import api from './utils/api';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import MobileBottomNav from './components/MobileBottomNav';

// Lazy load other pages to reduce initial bundle size
const Auth = lazy(() => import('./pages/Auth'));
const PostProperty = lazy(() => import('./pages/PostProperty'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const EMICalculator = lazy(() => import('./pages/EMICalculator'));
const ROICalculator = lazy(() => import('./pages/ROICalculator'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AIMatchQuiz = lazy(() => import('./pages/AIMatchQuiz'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    <p className="text-slate-500 font-medium">Loading...</p>
  </div>
);

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('React Error Boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-3">Something went wrong</h2>
            <p className="text-slate-600 mb-4 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Backend warmup is handled automatically by api.js on import
  // No need for a manual health check here

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-screen-xl">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/post-property" element={<PostProperty />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/emi-calculator" element={<EMICalculator />} />
              <Route path="/roi-calculator" element={<ROICalculator />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ai-quiz" element={<AIMatchQuiz />} />
            </Routes>
          </Suspense>
        </main>
        <MobileBottomNav />
      </div>
    </ErrorBoundary>
  );
}

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import api from './utils/api';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import PostProperty from './pages/PostProperty';
import PropertyDetail from './pages/PropertyDetail';
import EMICalculator from './pages/EMICalculator';
import ROICalculator from './pages/ROICalculator';
import Dashboard from './pages/Dashboard';
import AIMatchQuiz from './pages/AIMatchQuiz';
import MobileBottomNav from './components/MobileBottomNav';

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
  React.useEffect(() => {
    // Wake up Render backend
    api.get('/api/health').catch(() => {
      console.log('Backend waking up...');
    });
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-screen-xl">
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
        </main>
        <MobileBottomNav />
      </div>
    </ErrorBoundary>
  );
}

export default App;

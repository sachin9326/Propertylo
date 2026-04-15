import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'SEEKER' });
  const [error, setError] = useState(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.role);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-3xl font-bold text-center mb-6 text-slate-800">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              onChange={handleChange}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            onChange={handleChange}
          />
        </div>
        
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I want to</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="radio" name="role" value="SEEKER" checked={formData.role === 'SEEKER'} onChange={handleChange} className="mr-2 text-primary focus:ring-primary" />
                Find a Home
              </label>
              <label className="flex items-center">
                <input type="radio" name="role" value="UPLOADER" checked={formData.role === 'UPLOADER'} onChange={handleChange} className="mr-2 text-primary focus:ring-primary" />
                List a Property
              </label>
            </div>
          </div>
        )}
        
        <button type="submit" className="w-full py-3 mt-4 bg-primary text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-md">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      
      <p className="mt-6 text-center text-slate-600 text-sm">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  );
};

export default Auth;

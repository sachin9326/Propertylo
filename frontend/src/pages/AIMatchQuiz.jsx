import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Brain, ChevronRight, ChevronLeft, Check, Sparkles, RotateCcw } from 'lucide-react';

const questions = [
  {
    key: 'commuteTolerance',
    title: 'Daily Commute Tolerance',
    subtitle: 'How far are you willing to commute to work?',
    icon: '🚗',
    options: ['< 15 min', '15–30 min', '30–60 min', '60+ min'],
  },
  {
    key: 'schoolNearby',
    title: 'School Nearby?',
    subtitle: 'Do you need a school within 2km?',
    icon: '🏫',
    options: ['Yes', 'No'],
  },
  {
    key: 'noiseSensitivity',
    title: 'Noise Sensitivity',
    subtitle: 'What noise level is acceptable?',
    icon: '🔇',
    options: ['Silent', 'Moderate', 'Busy street ok'],
  },
  {
    key: 'greenSpace',
    title: 'Green Space Preference',
    subtitle: 'How important is a nearby park?',
    icon: '🌳',
    options: ['Park nearby essential', 'Nice to have', "Don't care"],
  },
  {
    key: 'safetyPriority',
    title: 'Safety Priority',
    subtitle: 'How important is neighborhood safety?',
    icon: '🛡️',
    options: ['Top', 'Medium', 'Low'],
  },
  {
    key: 'workFromHome',
    title: 'Work From Home?',
    subtitle: 'Do you work from home?',
    icon: '💻',
    options: ['Yes', 'Hybrid', 'No'],
  },
  {
    key: 'petOwner',
    title: 'Pet Owner?',
    subtitle: 'Do you have or plan to have pets?',
    icon: '🐾',
    options: ['Yes', 'No'],
  },
  {
    key: 'preferredFloor',
    title: 'Preferred Floor',
    subtitle: 'Which floor do you prefer?',
    icon: '🏢',
    options: ['Ground', 'Low (1-4)', 'High (5+)', 'Any'],
  },
];

const AIMatchQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingPrefs, setExistingPrefs] = useState(null);
  const [isRetake, setIsRetake] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchExistingPrefs();
  }, [user]);

  const fetchExistingPrefs = async () => {
    try {
      const { data } = await api.get(`/ai/preferences`);
      if (data.quizCompleted && data.preferences) {
        setExistingPrefs(data.preferences);
        setAnswers(data.preferences);
      }
    } catch (e) {}
  };

  const handleSelect = (key, value) => {
    const mapped = key === 'preferredFloor'
      ? value.replace(' (1-4)', '').replace(' (5+)', '')
      : value;
    setAnswers(prev => ({ ...prev, [key]: mapped }));
  };

  const handleNext = () => {
    if (step < questions.length - 1) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/ai/preferences`, answers);
      setSaved(true);
    } catch (error) {
      console.error(error);
      alert('Error saving preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setIsRetake(true);
    setExistingPrefs(null);
    setAnswers({});
    setStep(0);
    setSaved(false);
  };

  if (!user) return null;

  // Show existing preferences summary
  if (existingPrefs && !isRetake && !saved) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">AI Match Profile</h1>
              <p className="text-purple-200 mt-1">Your lifestyle preferences are set!</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Your Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questions.map(q => (
              <div key={q.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-2xl">{q.icon}</span>
                <div>
                  <p className="text-xs text-slate-500">{q.title}</p>
                  <p className="text-sm font-bold text-slate-800">{existingPrefs[q.key]}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={16} /> Retake Quiz
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Sparkles size={16} /> See Matched Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (saved) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <Check size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800">Profile Complete!</h2>
        <p className="text-slate-500">Every listing now shows your personalized AI Match Score.</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
        >
          <Sparkles size={18} className="inline mr-2" />
          Explore Matched Properties
        </button>
      </div>
    );
  }

  // Quiz flow
  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const canProceed = !!answers[currentQ.key];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">AI Match Quiz</h1>
              <p className="text-purple-200 text-sm">Tell us your lifestyle preferences</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-purple-200 text-xs mt-2">Question {step + 1} of {questions.length}</p>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">{currentQ.icon}</span>
          <h2 className="text-2xl font-extrabold text-slate-800">{currentQ.title}</h2>
          <p className="text-slate-500 mt-1">{currentQ.subtitle}</p>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {currentQ.options.map(option => {
            const mappedVal = currentQ.key === 'preferredFloor'
              ? option.replace(' (1-4)', '').replace(' (5+)', '')
              : option;
            const isSelected = answers[currentQ.key] === mappedVal;
            return (
              <button
                key={option}
                onClick={() => handleSelect(currentQ.key, option)}
                className={`w-full p-4 rounded-xl border-2 text-left font-semibold transition-all ${
                  isSelected
                    ? 'border-primary bg-blue-50 text-primary shadow-md shadow-primary/10'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {step < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : <>Complete <Sparkles size={16} /></>}
          </button>
        )}
      </div>
    </div>
  );
};

export default AIMatchQuiz;

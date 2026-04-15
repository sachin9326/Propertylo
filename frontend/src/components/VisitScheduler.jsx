import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, X, Loader2, CalendarPlus } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const VisitScheduler = ({ propertyId }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  // Get next 14 days
  const getDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      // Skip Sundays (0)
      if (d.getDay() !== 0) {
        dates.push({
          value: d.toISOString().split('T')[0],
          display: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
          day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          date: d.getDate(),
          month: d.toLocaleDateString('en-IN', { month: 'short' }),
        });
      }
    }
    return dates;
  };

  const dates = getDates();

  useEffect(() => {
    if (selectedDate) fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const { data } = await api.get(`/visits/slots/${propertyId}?date=${selectedDate}`);
      setAvailableSlots(data.available);
      setBookedSlots(data.booked);
    } catch (e) {
      setAvailableSlots(['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM']);
    } finally {
      setSlotsLoading(false);
    }
    setSelectedSlot('');
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;
    setLoading(true);
    try {
      await api.post('/visits/book', { propertyId, date: selectedDate, timeSlot: selectedSlot });
      setBooked(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = () => {
    const dateStr = selectedDate.replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Property+Visit&dates=${dateStr}T090000/${dateStr}T100000&details=Property+visit+booking`;
    window.open(url, '_blank');
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md text-sm"
      >
        <CalendarPlus size={16} /> Schedule a Visit
      </button>
    );
  }

  if (booked) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h4 className="text-lg font-bold text-emerald-800">Visit Confirmed!</h4>
        <p className="text-sm text-emerald-600 mt-1">
          {dates.find(d => d.value === selectedDate)?.display} at {selectedSlot}
        </p>
        <p className="text-xs text-slate-500 mt-3">A confirmation has been sent to {user?.email}</p>
        <button
          onClick={addToCalendar}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 font-semibold text-sm rounded-xl hover:bg-emerald-50 transition-colors mx-auto"
        >
          <CalendarPlus size={14} /> Add to Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <h4 className="font-bold text-slate-800">Schedule a Visit</h4>
        </div>
        <button onClick={() => setExpanded(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {!user ? (
        <div className="p-5 text-center">
          <p className="text-slate-600 text-sm mb-3">Please login to book a visit</p>
          <Link to="/auth" className="px-5 py-2 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-blue-600 transition-colors">
            Login to Continue
          </Link>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Date Picker */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.slice(0, 10).map(d => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDate(d.value)}
                  className={`flex-shrink-0 flex flex-col items-center p-2.5 rounded-xl border-2 transition-all min-w-[56px] ${
                    selectedDate === d.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase">{d.day}</span>
                  <span className="text-xl font-extrabold leading-tight">{d.date}</span>
                  <span className="text-[10px]">{d.month}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {slotsLoading ? 'Loading slots...' : 'Select Time Slot'}
              </p>
              {slotsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM'].map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                          isBooked
                            ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                            : isSelected
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-primary'
                        }`}
                      >
                        <Clock size={10} className="inline mr-1" />{slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          {selectedDate && selectedSlot && (
            <button
              onClick={handleBook}
              disabled={loading}
              className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Confirm Visit — {dates.find(d => d.value === selectedDate)?.display} at {selectedSlot}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitScheduler;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { UploadCloud, X, ChevronDown, Check, ArrowRight, ArrowLeft, Smartphone, Mail, User as UserIcon, MessageSquare } from 'lucide-react';

const PostProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', description: '', address: '', city: '', locality: '',
    areaSqFt: '', price: '', type: 'SALE', propertyType: 'Apartment',
    bhk: '2BHK', possessionStatus: 'Ready to Move', listingType: 'Resale',
    isVerified: false, isGated: false, isNewLaunch: false, isNewBooking: false,
    videoUrl: '', category: 'BUY', propertyKind: 'Residential',
    contactInfo: user?.phone || '9326072191'
  });
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <div className="text-center mt-20 text-xl font-semibold">Please log in to post a property.</div>;
  }

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const setManualValue = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    files.forEach(file => data.append('media', file));

    try {
      const res = await api.post('/api/properties', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/property/${res.data.id}`);
    } catch (error) {
      console.error(error);
      alert('Error uploading property');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Helpers ---

  const ChipSelector = ({ label, name, options, value }) => (
    <div className="space-y-3">
      <label className="block text-lg font-bold text-slate-900">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setManualValue(name, opt.value)}
              className={`px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all shadow-sm ${
                isSelected 
                  ? 'bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-100' 
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const SelectField = ({ label, name, options, value }) => (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer pr-10"
        >
          {options.map(opt => (
            <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );

  const ToggleField = ({ label, name, checked }) => (
    <label className="flex items-center justify-between cursor-pointer group p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
      <div className="relative">
        <input type="checkbox" name={name} checked={checked} onChange={handleChange} className="sr-only" />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`} />
        </div>
      </div>
    </label>
  );

  const resTypes = [
    { label: 'Apartment', value: 'Apartment' },
    { label: 'Independent House / Villa', value: 'Independent House / Villa' },
    { label: 'Independent / Builder Floor', value: 'Independent / Builder Floor' },
    { label: 'Plot / Land', value: 'Plot / Land' },
    { label: '1 RK / Studio Apartment', value: '1 RK / Studio Apartment' },
    { label: 'Serviced Apartment', value: 'Serviced Apartment' },
  ];

  const commTypes = [
    { label: 'Office Space', value: 'Office Space' },
    { label: 'Shop / Showroom', value: 'Shop / Showroom' },
    { label: 'Warehouse / Godown', value: 'Warehouse / Godown' },
    { label: 'Industrial Building', value: 'Industrial Building' },
    { label: 'Commercial Land', value: 'Commercial Land' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-primary font-bold hover:bg-blue-50 rounded-xl transition-colors">
          <MessageSquare size={18} /> Post Via WhatsApp
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Add Basic Details</h1>
        <p className="text-slate-400 font-bold tracking-wider text-xs uppercase mt-2">Step {step} of 3</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Looking to? */}
            <ChipSelector 
              label="You're looking to?"
              name="type"
              value={formData.type}
              options={[
                { label: 'Sell', value: 'SALE' },
                { label: 'Rent / Lease', value: 'RENT' },
                { label: 'Paying Guest', value: 'PG' },
              ]}
            />

            {/* Kind of property */}
            <ChipSelector 
              label="What kind of property?"
              name="propertyKind"
              value={formData.propertyKind}
              options={[
                { label: 'Residential', value: 'Residential' },
                { label: 'Commercial', value: 'Commercial' },
              ]}
            />

            {/* Property Type */}
            <ChipSelector 
              label="Select Property Type"
              name="propertyType"
              value={formData.propertyType}
              options={formData.propertyKind === 'Residential' ? resTypes : commTypes}
            />

            {/* Contact Details */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-900">Your contact details</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
                  <span className="font-bold text-slate-600 border-r border-slate-200 pr-2">+91</span>
                </div>
                <input 
                  type="text" 
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  className="w-full pl-20 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                  placeholder="9326072191"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <Smartphone size={20} />
                </div>
              </div>
              <p className="text-slate-400 text-xs font-medium">You're posting as <span className="text-slate-700 font-bold">{user.name}</span> - <button type="button" className="underline text-blue-600">Change Account</button></p>
            </div>

            <button 
              type="button" 
              onClick={() => setStep(2)}
              className="w-full py-5 bg-blue-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black text-slate-900">Location & Property Details</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Property Title</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Luxury 4BHK Villa with Pvt Pool" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <SelectField label="City" name="city" value={formData.city} options={['Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Hyderabad', 'Chennai']} />
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Locality</label>
                  <input type="text" name="locality" required value={formData.locality} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Enter locality" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Area (Sq. Ft)</label>
                  <input type="number" name="areaSqFt" required value={formData.areaSqFt} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Price (₹)</label>
                  <input type="number" name="price" required value={formData.price} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
              </div>

              {formData.propertyKind === 'Residential' && (
                <div className="grid grid-cols-2 ml-[-1rem] mr-[-1rem] transition-all">
                  <ChipSelector label="BHK" name="bhk" value={formData.bhk} options={[
                    { label: '1 RK', value: '1BHK' },
                    { label: '1 BHK', value: '1BHK' },
                    { label: '2 BHK', value: '2BHK' },
                    { label: '3 BHK', value: '3BHK' },
                    { label: '4+ BHK', value: '4+ BHK' },
                  ]} />
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <ToggleField label="Gated Society" name="isGated" checked={formData.isGated} />
                <ToggleField label="Verified Property" name="isVerified" checked={formData.isVerified} />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <h3 className="text-xl font-black text-slate-900">Media & Description</h3>
             
             <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Description</label>
                <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Details about amenities, layout, and area..." />
              </div>

             <div
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-blue-400'}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
            >
              <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={40} />
              </div>
              <p className="text-lg font-black text-slate-900">Upload Photos</p>
              <p className="text-sm text-slate-500 font-bold">Drag and drop or click to browse</p>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {files.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm animate-in zoom-in duration-300">
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                    <button type="button" onClick={() => removeFile(i)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all">
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">
                {loading ? 'Publishing...' : 'Publish Property'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PostProperty;


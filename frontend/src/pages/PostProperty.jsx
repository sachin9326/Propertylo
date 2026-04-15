import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { UploadCloud, X, ChevronDown } from 'lucide-react';

const PostProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', description: '', address: '', city: '', locality: '',
    areaSqFt: '', price: '', type: 'SALE', propertyType: 'Flat',
    bhk: '2BHK', possessionStatus: 'Ready to Move', listingType: 'Resale',
    isVerified: false, isGated: false, isNewLaunch: false, isNewBooking: false,
    videoUrl: ''
  });
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'UPLOADER') {
    return <div className="text-center mt-20 text-xl font-semibold">Unauthorized. Only Uploaders can post.</div>;
  }

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
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
      const res = await api.post('/properties', data, {
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

  const SelectField = ({ label, name, options, value }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer pr-10"
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
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
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

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100">
      <h2 className="text-3xl font-extrabold mb-2 text-slate-800">Post a New Property</h2>
      <p className="text-slate-500 mb-8 border-b border-slate-100 pb-4">Fill all details to list your property professionally</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* === ROW 1: Basic Info === */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">1</span>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
              <input type="text" name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.title} placeholder="e.g., Spacious 3BHK in Andheri West" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea name="description" required rows="3" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.description} placeholder="Describe the property features, amenities, and nearby landmarks..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
              <input type="text" name="city" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.city} placeholder="e.g., Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Locality</label>
              <input type="text" name="locality" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.locality} placeholder="e.g., Andheri West" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Address</label>
              <input type="text" name="address" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.address} placeholder="Complete address with landmark" />
            </div>
          </div>
        </div>

        {/* === ROW 2: Property Details === */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            Property Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Area (Sq. Ft)</label>
              <input type="number" name="areaSqFt" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.areaSqFt} placeholder="1200" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹)</label>
              <input type="number" name="price" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.price} placeholder="5000000" />
            </div>
            <SelectField label="Listing For" name="type" value={formData.type} options={[
              { value: 'SALE', label: 'For Sale' },
              { value: 'RENT', label: 'For Rent' },
              { value: 'BUY', label: 'To Buy' },
            ]} />
            <SelectField label="Property Type" name="propertyType" value={formData.propertyType} options={[
              'Flat', 'Independent House', 'Villa', 'Plot'
            ]} />
            <SelectField label="Configuration" name="bhk" value={formData.bhk} options={[
              '1BHK', '2BHK', '3BHK', '4+ BHK'
            ]} />
            <SelectField label="Possession Status" name="possessionStatus" value={formData.possessionStatus} options={[
              'Ready to Move', 'Under Construction'
            ]} />
            <SelectField label="Listing Type" name="listingType" value={formData.listingType} options={[
              'New Launch', 'New Project', 'New Booking', 'Resale'
            ]} />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Video Link (Optional)</label>
              <input type="url" name="videoUrl" placeholder="https://youtube.com/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" onChange={handleChange} value={formData.videoUrl} />
            </div>
          </div>
        </div>

        {/* === ROW 3: Toggles === */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">3</span>
            Property Attributes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <ToggleField label="Verified Property" name="isVerified" checked={formData.isVerified} />
            <ToggleField label="Gated Society" name="isGated" checked={formData.isGated} />
            <ToggleField label="New Launch" name="isNewLaunch" checked={formData.isNewLaunch} />
            <ToggleField label="New Booking" name="isNewBooking" checked={formData.isNewBooking} />
          </div>
        </div>

        {/* === ROW 4: Media Upload === */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">4</span>
            Media Upload
          </h3>
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,video/*" />
            <UploadCloud className={`mx-auto h-14 w-14 mb-3 ${dragActive ? 'text-primary' : 'text-slate-400'}`} />
            <p className="text-lg font-semibold text-slate-700">Drag & drop files here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
            <p className="text-xs text-slate-400 mt-3">Supports JPG, PNG, MP4</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Selected Files ({files.length}):</h4>
              <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 text-sm bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="truncate max-w-[250px] font-medium text-slate-700">{file.name}</span>
                    <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === SUBMIT === */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publishing...' : 'Publish Property Listing'}
        </button>
      </form>
    </div>
  );
};

export default PostProperty;

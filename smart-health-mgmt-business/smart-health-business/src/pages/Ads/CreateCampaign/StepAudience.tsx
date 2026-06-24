import React, { useState, useEffect } from 'react';
import { MapPin, Users, Hash, Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
  type: 'city' | 'state' | 'country';
  value: string;
  label: string;
}

interface StepAudienceProps {
  data: {
    locations: Location[];
    ageRange: { min: number; max: number };
    genders: string[];
    interests: string[];
  };
  updateData: (fields: any) => void;
}

const suggestedInterests = [
  'Diabetes', 'Hypertension', 'Fitness', 'Cardiac Health', 'Dental Care', 
  'Mental Health', 'Yoga', 'Nutrition', 'Pediatrics', 'Elderly Care',
  'Skin Care', 'Orthopedics', 'Weight Loss', 'Wellness'
];

const defaultUSLocations = [
  'New York, New York', 'Los Angeles, California', 'Chicago, Illinois', 
  'Houston, Texas', 'Phoenix, Arizona', 'Philadelphia, Pennsylvania', 
  'San Antonio, Texas', 'San Diego, California', 'Dallas, Texas', 'San Jose, California'
];

const StepAudience: React.FC<StepAudienceProps> = ({ data, updateData }) => {
  const [locInput, setLocInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  useEffect(() => {
    if (!locInput.trim() || locInput.length < 2) {
      setApiSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsFetchingLocations(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locInput)}&countrycodes=us&format=json&limit=5`, {
            headers: {
                'User-Agent': 'SmartHealthApp/1.0'
            }
        });
        const result = await response.json();
        
        // Extract meaningful names (City, State)
        const names = result.map((item: any) => {
            const parts = item.display_name.split(', ');
            if (parts.length >= 3) {
                // Usually returns: "City, County, State, Country" or "City, State, Country"
                // We'll take the first part and the state (second to last)
                return `${parts[0]}, ${parts[parts.length - 2]}`;
            }
            return item.display_name;
        });
        
        const uniqueNames = Array.from(new Set<string>(names));
        setApiSuggestions(uniqueNames);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setIsFetchingLocations(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [locInput]);

  const addLocation = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && locInput.trim()) {
      const newLoc: Location = { type: 'city', value: locInput.trim().toLowerCase(), label: locInput.trim() };
      if (!data.locations.find(l => l.value === newLoc.value)) {
        updateData({ locations: [...data.locations, newLoc] });
      }
      setLocInput('');
    }
  };

  const removeLocation = (val: string) => {
    updateData({ locations: data.locations.filter(l => l.value !== val) });
  };

  const toggleGender = (gender: string) => {
    const newGenders = data.genders.includes(gender)
      ? data.genders.filter(g => g !== gender)
      : [...data.genders, gender];
    updateData({ genders: newGenders });
  };

  const toggleInterest = (interest: string) => {
    const newInterests = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest];
    updateData({ interests: newInterests });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">Define your target audience</h2>
        <p className="text-slate-500 mt-2">Specify who should see your ads based on location, age, and health interests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Location & Age */}
        <div className="space-y-8">
          {/* Location */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
              <MapPin size={18} className="text-[#9146C1]" /> Locations (USA)
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search and select a US city..."
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={addLocation}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-[#9146C1] outline-none transition-all text-sm"
              />
              {(isFocused || locInput.trim()) && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-lg z-10 p-2">
                  {isFetchingLocations ? (
                    <div className="px-4 py-3 text-sm text-slate-500 flex items-center justify-center font-['AeonikMedium']">
                        <Loader2 size={16} className="animate-spin mr-2 text-[#9146C1]" /> Searching locations...
                    </div>
                  ) : (
                    <>
                      {(locInput.trim() ? apiSuggestions : defaultUSLocations)
                        .map((loc) => (
                          <div
                            key={loc}
                            onClick={() => {
                              const newLoc: Location = { type: 'city', value: loc.toLowerCase(), label: loc };
                              if (!data.locations.find((l) => l.value === newLoc.value)) {
                                updateData({ locations: [...data.locations, newLoc] });
                              }
                              setLocInput('');
                            }}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-[#9146C1] cursor-pointer rounded-lg font-['AeonikMedium']"
                          >
                            {loc}
                          </div>
                        ))}
                      {locInput.trim() && apiSuggestions.length === 0 && (
                         <div
                            onClick={() => {
                              const newLoc: Location = { type: 'city', value: locInput.trim().toLowerCase(), label: locInput.trim() };
                              if (!data.locations.find((l) => l.value === newLoc.value)) {
                                updateData({ locations: [...data.locations, newLoc] });
                              }
                              setLocInput('');
                            }}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-purple-50 hover:text-[#9146C1] cursor-pointer rounded-lg font-['AeonikMedium']"
                         >
                           Add "{locInput}"
                         </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {data.locations.map((loc) => (
                  <motion.span
                    key={loc.value}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-100 text-[#9146C1] text-xs font-['AeonikBold'] rounded-lg shadow-sm"
                  >
                    {loc.label}
                    <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => removeLocation(loc.value)} />
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
              <Users size={18} className="text-[#9146C1]" /> Age Range ({data.ageRange.min} - {data.ageRange.max})
            </label>
            <div className="px-2 pt-4">
              <input
                type="range"
                min="13"
                max="100"
                value={data.ageRange.min}
                onChange={(e) => updateData({ ageRange: { ...data.ageRange, min: parseInt(e.target.value) } })}
                className="w-full accent-[#9146C1]"
              />
              <input
                type="range"
                min="13"
                max="100"
                value={data.ageRange.max}
                onChange={(e) => updateData({ ageRange: { ...data.ageRange, max: parseInt(e.target.value) } })}
                className="w-full accent-[#9146C1] mt-4"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Gender & Interests */}
        <div className="space-y-8">
          {/* Gender */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
              Gender
            </label>
            <div className="flex gap-2">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGender(g)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-xs font-['AeonikBold'] uppercase tracking-widest transition-all ${
                    data.genders.includes(g)
                      ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-purple-200'
                  }`}
                >
                  {g}
                </button>
              ))}
              <button
                onClick={() => updateData({ genders: ['all'] })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-xs font-['AeonikBold'] uppercase tracking-widest transition-all ${
                  data.genders.includes('all')
                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-purple-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-['AeonikBold'] text-slate-700 uppercase tracking-wider">
              <Hash size={18} className="text-[#9146C1]" /> Health Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border text-[11px] font-['AeonikBold'] uppercase tracking-wider transition-all ${
                    data.interests.includes(interest)
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-purple-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepAudience;

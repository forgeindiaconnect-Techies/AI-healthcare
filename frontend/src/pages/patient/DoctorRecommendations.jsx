import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import BookAppointmentModal from '../../components/patient/BookAppointmentModal';
import { Search, Star, MapPin, Clock, Building2, Video as VideoIcon, UserCircle, Calendar, XCircle, ChevronRight, Activity, Heart, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [facilityFilter, setFacilityFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [maxFee, setMaxFee] = useState('');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Fetching up to 50 top-rated doctors
      const { data } = await API.get('/api/doctors?limit=50', config);
      // Smart sort: Highest rating, then experience
      const sortedDoctors = (data.data || []).sort((a, b) => {
        if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
        return (b.experience || 0) - (a.experience || 0);
      });
      setDoctors(sortedDoctors);
    } catch (error) {
      console.error('Error fetching doctors', error);
      toast.error('Failed to load doctor recommendations');
    } finally {
      setLoading(false);
    }
  };

  const specialties = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'All' || doc.specialization === specialtyFilter;
    const matchesFacility = facilityFilter === 'All' || doc.facilityType === facilityFilter;
    const docLocation = doc.clinicAddress || '';
    const matchesLocation = typeof docLocation === 'object' 
      ? Object.values(docLocation).join(' ').toLowerCase().includes(locationFilter.toLowerCase())
      : String(docLocation).toLowerCase().includes(locationFilter.toLowerCase());
    const docFee = doc.consultationFee || 0;
    const matchesFee = !maxFee || docFee <= Number(maxFee);

    return matchesSearch && matchesSpecialty && matchesFacility && matchesLocation && matchesFee;
  });

  const handleOpenBooking = (doc) => {
    setSelectedDoctor(doc);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Already handled internally by modal showing toast
    // Can navigate to appointments or show a success screen here if needed
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 font-medium flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          Analyzing your health profile to find the best doctors...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Heart className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <Shield className="w-3 h-3" /> Personalized for you
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 text-white">Top Rated Specialists</h1>
          <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
            Based on your health history and preferences, we've curated a list of top-tier healthcare professionals ready to assist you.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by doctor name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
            />
          </div>
          <div className="relative w-full md:w-1/4">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Filter by location (City, State)..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
            />
          </div>
          <div className="w-full md:w-1/4">
            <select 
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
            >
              <option value="All">All Facilities</option>
              <option value="Clinic">Clinic</option>
              <option value="Hospital">Hospital</option>
              <option value="Virtual">Virtual / Telemedicine</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="w-full md:w-1/6">
            <input 
              type="number" 
              placeholder="Max Fee ($)"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full pb-2 scrollbar-hide">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSpecialtyFilter(spec)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border ${
                specialtyFilter === spec 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No doctors found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDoctors.map(doc => (
            <div key={doc._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
              <div className="p-6 pb-0 flex gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-100 flex-shrink-0 relative z-10 group-hover:scale-105 transition-transform duration-300">
                    {doc.user?.avatar ? (
                      <img src={doc.user.avatar} alt={doc.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-300">
                        <UserCircle className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  {doc.isAcceptingPatients && (
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full z-20" title="Accepting New Patients"></div>
                  )}
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-1">{doc.user?.name || 'Unknown Doctor'}</h3>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold">{doc.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">{doc.totalRatings || 0} Reviews</span>
                    </div>
                  </div>
                  <p className="text-indigo-600 font-semibold text-sm mt-0.5">{doc.specialization}</p>
                  <p className="text-gray-500 text-xs font-medium mt-1">{doc.experience} Years Experience</p>
                </div>
              </div>

              <div className="px-6 py-4 mt-4 bg-gray-50/50 border-t border-gray-50 grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{typeof doc.clinicAddress === 'object' ? Object.values(doc.clinicAddress).filter(Boolean).join(', ') : (doc.clinicAddress || 'Virtual Only')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span>Fee: ${doc.consultationFee || 0}</span>
                </div>
              </div>

              <div className="p-6 pt-4 mt-auto">
                <button 
                  onClick={() => handleOpenBooking(doc)}
                  className="w-full py-3.5 bg-gray-900 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-colors shadow-md shadow-gray-200 hover:shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookAppointmentModal 
        isOpen={bookingModalOpen && selectedDoctor}
        onClose={() => { setBookingModalOpen(false); setSelectedDoctor(null); }}
        doctors={selectedDoctor ? [selectedDoctor] : []}
        onSuccess={handleBookingSuccess}
        user={user}
      />
    </div>
  );
};

export default DoctorRecommendations;

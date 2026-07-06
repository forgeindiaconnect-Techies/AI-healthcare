import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Mic, MicOff, Video, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WaitingRoom = ({ appointment, isDoctor, onJoin, localStream, setLocalStream }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Could not access camera or microphone. Please check permissions.');
      }
    };
    initCamera();

    return () => {
      // Don't stop tracks here, we need them for the VideoRoom!
    };
  }, []);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
        
        {/* Video Preview Side */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-gray-700 shadow-inner">
            {localStream ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${!isVideoEnabled && 'hidden'}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading camera...
              </div>
            )}
            
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                  <CameraOff className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
               <button 
                onClick={toggleAudio}
                className={`p-4 rounded-full shadow-lg backdrop-blur-md transition-all ${isAudioEnabled ? 'bg-gray-900/60 hover:bg-gray-900/80 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
               >
                 {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
               </button>
               <button 
                onClick={toggleVideo}
                className={`p-4 rounded-full shadow-lg backdrop-blur-md transition-all ${isVideoEnabled ? 'bg-gray-900/60 hover:bg-gray-900/80 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
               >
                 {isVideoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
               </button>
            </div>
          </div>
          {error && <p className="mt-4 text-red-400 text-sm font-bold text-center">{error}</p>}
        </div>

        {/* Info Side */}
        <div className="p-8 flex flex-col justify-center bg-gray-800/50 border-l border-gray-700">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 border border-indigo-500/20">
              <Video className="w-4 h-4" /> Telemedicine Portal
            </span>
            <h1 className="text-3xl font-bold text-white mb-2">Ready to join?</h1>
            <p className="text-gray-400 font-medium">
              {isDoctor ? "Your patient is waiting for you to start the consultation." : "Please wait here. Your doctor will join shortly."}
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50 mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Appointment Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-gray-700">
                   {isDoctor ? appointment.patient?.name?.charAt(0) : appointment.doctor?.name?.charAt(4)}
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">{isDoctor ? appointment.patient?.name : `Dr. ${appointment.doctor?.name}`}</p>
                   <p className="text-xs text-gray-500">{isDoctor ? 'Patient' : appointment.doctorProfile?.specialization || 'Doctor'}</p>
                 </div>
              </div>
            </div>
          </div>

          {isDoctor && appointment.preConsultationIntake && (
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50 mb-8 max-h-[250px] overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Patient Intake Information</h3>
              <div className="space-y-4 text-sm">
                <div><span className="text-gray-400">Problem:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.healthProblem}</span></div>
                <div><span className="text-gray-400">Symptoms:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.symptoms?.join(', ') || 'N/A'}</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-400">Duration:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.duration}</span></div>
                  <div><span className="text-gray-400">Pain Level:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.painLevel}/10</span></div>
                  <div><span className="text-gray-400">Age:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.age || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Gender:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.gender || 'N/A'}</span></div>
                </div>
                <div><span className="text-gray-400">Allergies:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.allergies?.join(', ') || 'None'}</span></div>
                <div><span className="text-gray-400">Medicines:</span> <span className="text-white font-medium">{appointment.preConsultationIntake.currentMedicines?.join(', ') || 'None'}</span></div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <button 
              onClick={handleLeave}
              className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={onJoin}
              disabled={!localStream}
              className={`flex-1 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${localStream ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            >
              {isDoctor ? 'Start Consultation' : 'Join Consultation'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WaitingRoom;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

import WaitingRoom from './WaitingRoom';
import VideoRoom from './VideoRoom';
import ConsultationPanel from './ConsultationPanel';
import PreConsultationIntake from './PreConsultationIntake';
import Header from '../../components/layout/Header';

const VideoConsultation = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  // Doctor Consultation State
  const [doctorNotes, setDoctorNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [simpleExplanation, setSimpleExplanation] = useState('');
  const [treatmentAdvice, setTreatmentAdvice] = useState('');
  const [testsNeeded, setTestsNeeded] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [emergencySigns, setEmergencySigns] = useState('');

  const isDoctor = user?.role === 'doctor';
  
  // Intake Flow State
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const [savingIntake, setSavingIntake] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        // Fetch all appointments and find the one matching this room ID
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await API.get('/api/appointments', config);
        const apts = res.data.data || res.data || [];
        const currentApt = apts.find(a => a.meetingLink && a.meetingLink.includes(roomId));
        
        if (!currentApt) {
          toast.error("Invalid meeting link or appointment not found.");
          navigate('/dashboard');
          return;
        }

        if (currentApt.status === 'completed') {
          toast.error("This consultation has already been completed.");
          navigate('/dashboard');
          return;
        }
        
        if (['no-show', 'cancelled'].includes(currentApt.status)) {
          toast.error("This consultation has been cancelled or expired.");
          navigate('/dashboard');
          return;
        }

        // Validate time window
        const now = new Date();
        const dateStr = new Date(currentApt.appointmentDate).toISOString().split('T')[0];
        const aptStart = new Date(`${dateStr}T${currentApt.appointmentTime}:00`);
        const aptEnd = new Date(aptStart.getTime() + 5 * 60000);

        if (now < aptStart) {
          toast.error("The meeting has not started yet.");
          navigate('/dashboard');
          return;
        }

        if (now > aptEnd && !currentApt.patientJoined && !currentApt.doctorJoined) {
          toast.error("The meeting link has expired.");
          navigate('/dashboard');
          return;
        }

        if (!isDoctor && currentApt.preConsultationIntake) {
          setIntakeCompleted(true);
        }

        setAppointment(currentApt);
      } catch (err) {
        console.error("Error fetching appointment", err);
        toast.error("Failed to load meeting details.");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointment();
    }
  }, [user, roomId, navigate]);

  const handleJoinCall = () => {
    setIsInCall(true);
  };

  const handleEndCall = async (duration) => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (isDoctor) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await API.post('/api/consultations/end', {
          appointmentId: appointment._id,
          doctorNotes,
          diagnosis,
          duration,
          simpleExplanation,
          treatmentAdvice,
          testsNeeded,
          followUpDate,
          emergencySigns
        }, config);
        toast.success("Consultation saved and completed.");
      } catch (err) {
        console.error("Failed to save consultation", err);
        toast.error("Failed to save consultation details.");
      }
    } else {
      toast.success("Consultation ended.");
    }
    
    navigate(`/dashboard/consultation-summary/${appointment._id}`);
  };

  const handleIntakeSubmit = async (data) => {
    setSavingIntake(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await API.put(`/api/appointments/${appointment._id}/intake`, data, config);
      setIntakeCompleted(true);
      toast.success('Intake information saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save intake information.');
    } finally {
      setSavingIntake(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Optional: Minimal header */}
      <div className="h-16 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center px-6 justify-between">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">H</div>
           <span className="text-white font-bold hidden sm:block text-lg">HealthAI <span className="text-gray-400 font-normal">Telemedicine Portal</span></span>
         </div>
         {isInCall && (
           <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-bold animate-pulse">
             LIVE
           </span>
         )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {!isDoctor && !intakeCompleted ? (
            <PreConsultationIntake onSubmit={handleIntakeSubmit} loading={savingIntake} />
          ) : !isInCall ? (
            <WaitingRoom 
              appointment={appointment} 
              isDoctor={isDoctor} 
              onJoin={handleJoinCall} 
              localStream={localStream}
              setLocalStream={setLocalStream}
            />
          ) : (
            <VideoRoom 
              appointment={appointment} 
              isDoctor={isDoctor} 
              socket={socket} 
              roomId={roomId} 
              localStream={localStream}
              onEndCall={handleEndCall}
            />
          )}
        </div>

        {/* Doctor Side Panel */}
        {isDoctor && isInCall && (
          <div className="w-[400px] shrink-0 h-full border-l border-gray-800 hidden lg:block bg-white">
            <ConsultationPanel 
              appointment={appointment}
              onNotesUpdate={setDoctorNotes}
              onDiagnosisUpdate={setDiagnosis}
              onSimpleExplanationUpdate={setSimpleExplanation}
              onTreatmentAdviceUpdate={setTreatmentAdvice}
              onTestsNeededUpdate={setTestsNeeded}
              onFollowUpDateUpdate={setFollowUpDate}
              onEmergencySignsUpdate={setEmergencySigns}
              values={{
                doctorNotes, diagnosis, simpleExplanation, treatmentAdvice, testsNeeded, followUpDate, emergencySigns
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConsultation;

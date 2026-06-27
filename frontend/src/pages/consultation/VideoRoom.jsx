import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff, MessageSquare, Maximize2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VideoRoom = ({ appointment, isDoctor, socket, roomId, localStream, onEndCall }) => {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  // Ensure remote stream is attached to video element when it updates
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    // 1. Initialize Local Video
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    // 2. Start Call Duration Timer
    const timer = setInterval(() => setCallDuration(p => p + 1), 1000);

    // 3. Initialize WebRTC
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;
    
    // Ice candidate queue for race conditions
    let iceCandidateQueue = [];

    // Add local tracks to peer connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate, senderId: socket.id });
      }
    };

    // Socket listeners for signaling
    const handleUserConnected = async ({ userId }) => {
      toast.success(isDoctor ? 'Patient joined the room' : 'Doctor joined the room');
      // The person already in the room (e.g. Doctor) initiates the offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { roomId, offer, senderId: socket.id });
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    };

    const handleOffer = async ({ offer, senderId }) => {
      if (senderId === socket.id) return; // ignore own offer
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Process queued candidates
        iceCandidateQueue.forEach(async (cand) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) { console.error(e); }
        });
        iceCandidateQueue = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { roomId, answer, senderId: socket.id });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    };

    const handleAnswer = async ({ answer, senderId }) => {
      if (senderId === socket.id) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process queued candidates
        iceCandidateQueue.forEach(async (cand) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) { console.error(e); }
        });
        iceCandidateQueue = [];
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    };

    const handleIceCandidate = async ({ candidate, senderId }) => {
      if (senderId === socket.id) return;
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidateQueue.push(candidate);
        }
      } catch (error) {
        console.error("Error adding ice candidate:", error);
      }
    };

    const handleChatMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleConsultationEnded = () => {
      toast('The consultation has been ended.');
      onEndCall(callDuration);
    };

    // Register socket events
    socket.on('user-connected', handleUserConnected);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('consultation-chat-message', handleChatMessage);
    socket.on('consultation-ended', handleConsultationEnded);

    // If I just joined, tell the room so the other peer can send an offer
    socket.emit('join-consultation-room', { roomId, userId: isDoctor ? appointment.doctor._id : appointment.patient._id, role: isDoctor ? 'doctor' : 'patient' });

    // Cleanup
    return () => {
      clearInterval(timer);
      socket.off('user-connected', handleUserConnected);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('consultation-chat-message', handleChatMessage);
      socket.off('consultation-ended', handleConsultationEnded);
      pc.close();
    };
  }, []);

  const toggleMute = () => {
    localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
    setIsMuted(!localStream.getAudioTracks()[0].enabled);
  };

  const toggleVideo = () => {
    localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
    setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          sender.replaceTrack(localStream.getVideoTracks()[0]);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
      sender.replaceTrack(localStream.getVideoTracks()[0]);
      setIsScreenSharing(false);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const msg = { sender: isDoctor ? 'Doctor' : 'Patient', text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    socket.emit('consultation-chat-message', { roomId, message: msg });
    setChatMessage('');
  };

  const handleEndCall = () => {
    socket.emit('end-consultation', { roomId });
    onEndCall(callDuration);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-800">
      
      {/* Top Bar Info */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700 pointer-events-auto">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             <span className="text-white text-xs font-bold font-mono tracking-widest">{formatDuration(callDuration)}</span>
          </div>
          <span className="text-white font-bold drop-shadow-md">
            {isDoctor ? appointment.patient?.name : `Dr. ${appointment.doctor?.name}`}
          </span>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
        {!remoteStream ? (
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <span className="text-3xl text-gray-600 font-bold">{isDoctor ? 'P' : 'D'}</span>
            </div>
            <p className="text-gray-400 font-medium">Waiting for {isDoctor ? 'Patient' : 'Doctor'} to join...</p>
          </div>
        ) : (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}

        {/* PIP Local Video */}
        <div className="absolute bottom-24 right-6 w-48 aspect-video bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl z-20">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <CameraOff className="w-6 h-6 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-gray-700 shadow-2xl z-30">
        <button onClick={toggleMute} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'}`}>
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'}`}>
          {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </button>
        <button onClick={toggleScreenShare} className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'}`}>
          <MonitorUp className="w-5 h-5" />
        </button>
        <button onClick={() => setShowChat(!showChat)} className={`p-4 rounded-2xl transition-all ${showChat ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white relative'}`}>
          <MessageSquare className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-gray-700 mx-2"></div>
        <button onClick={handleEndCall} className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/25 flex items-center gap-2">
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>

      {/* Chat Drawer */}
      {showChat && (
        <div className="absolute top-4 right-4 bottom-32 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl flex flex-col z-20 overflow-hidden animate-in slide-in-from-right-4">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Meeting Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white"><XCircle className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === (isDoctor ? 'Doctor' : 'Patient') ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 font-bold mb-1">{m.sender} • {m.time}</span>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${m.sender === (isDoctor ? 'Doctor' : 'Patient') ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-800">
            <input 
              type="text" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type message..."
              className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>
      )}

    </div>
  );
};

export default VideoRoom;

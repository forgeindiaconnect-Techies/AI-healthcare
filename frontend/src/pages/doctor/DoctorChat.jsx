import React from 'react';
import ChatWindow from '../../components/chat/ChatWindow';

/**
 * DoctorChat wraps the shared ChatWindow for the doctor side.
 *
 * Props:
 *  - patientId      : MongoDB _id of the patient (User)
 *  - patientName    : patient display name
 *  - patientAvatar  : optional avatar URL
 *  - onClose        : callback to close the modal
 */
const DoctorChat = ({ patientId, patientName, patientAvatar, onClose }) => {
  return (
    <ChatWindow
      otherUserId={patientId}
      otherUserName={patientName}
      otherUserRole="patient"
      otherUserAvatar={patientAvatar}
      onClose={onClose}
    />
  );
};

export default DoctorChat;

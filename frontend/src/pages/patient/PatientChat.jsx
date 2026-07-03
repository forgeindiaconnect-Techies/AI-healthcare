import React from 'react';
import ChatWindow from '../../components/chat/ChatWindow';

/**
 * PatientChat wraps the shared ChatWindow for the patient side.
 *
 * Props:
 *  - doctorId      : MongoDB _id of the doctor (User)
 *  - doctorName    : doctor display name
 *  - doctorAvatar  : optional avatar URL
 *  - onClose       : callback to close the modal
 */
const PatientChat = ({ doctorId, doctorName, doctorAvatar, onClose }) => {
  return (
    <ChatWindow
      otherUserId={doctorId}
      otherUserName={doctorName}
      otherUserRole="doctor"
      otherUserAvatar={doctorAvatar}
      onClose={onClose}
    />
  );
};

export default PatientChat;

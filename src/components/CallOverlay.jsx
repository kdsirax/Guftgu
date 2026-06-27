import React, { useContext, useEffect, useRef } from "react";
import { CallContext } from "../context/CallContext";
import { AuthContext } from "../context/AuthContext";

const Video = ({ stream, muted }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} />;
};

const CallOverlay = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    call,
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera
  } = useContext(CallContext);

  if (callState === "idle" || !call) return null;

  const remoteName = call.callerId === currentUser.uid ? call.receiverName : call.callerName;

  return (
    <div className={`callOverlay ${callState}`}>
      {callState === "ringing" && (
        <div className="incomingCallCard">
          <div className="callerAvatarContainer">
            {call.callerPhoto ? (
              <img src={call.callerPhoto} alt={call.callerName} className="callerAvatar" />
            ) : (
              <div className="callerAvatarPlaceholder">
                {call.callerName ? call.callerName[0].toUpperCase() : "?"}
              </div>
            )}
            <div className="pulseRing ring1"></div>
            <div className="pulseRing ring2"></div>
          </div>
          <h2>{call.callerName}</h2>
          <p>Incoming Video Call...</p>
          <div className="callActions">
            <button className="btnAccept" onClick={acceptCall}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.27c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.27 1.11z"/>
              </svg>
              Accept
            </button>
            <button className="btnReject" onClick={rejectCall}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c-2.48 0-4.5-2.02-4.5-4.5S10.52 8 13 8s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" transform="rotate(135 12 12)"/>
              </svg>
              Decline
            </button>
          </div>
        </div>
      )}

      {callState === "calling" && (
        <div className="outgoingCallScreen">
          <div className="receiverAvatarContainer">
            {call.receiverPhoto ? (
              <img src={call.receiverPhoto} alt={call.receiverName} className="receiverAvatar" />
            ) : (
              <div className="receiverAvatarPlaceholder">
                {call.receiverName ? call.receiverName[0].toUpperCase() : "?"}
              </div>
            )}
            <div className="pulseRing ring1"></div>
            <div className="pulseRing ring2"></div>
          </div>
          <h2>Calling {call.receiverName}...</h2>
          <p>Waiting for answer</p>
          <button className="btnEnd" onClick={endCall}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c-2.48 0-4.5-2.02-4.5-4.5S10.52 8 13 8s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" transform="rotate(135 12 12)"/>
            </svg>
            Cancel
          </button>
        </div>
      )}

      {callState === "accepted" && (
        <div className="activeCallScreen">
          <div className="videoGrid">
            {remoteStream ? (
              <div className="remoteVideoContainer">
                <Video stream={remoteStream} muted={false} />
                <span className="videoLabel">{remoteName}</span>
              </div>
            ) : (
              <div className="remoteVideoPlaceholder">Connecting stream...</div>
            )}

            {localStream && (
              <div className={`localVideoContainer ${isCameraOff ? "cameraOff" : ""}`}>
                {isCameraOff ? (
                  <div className="localAvatarPlaceholder">
                    Camera Off
                  </div>
                ) : (
                  <Video stream={localStream} muted={true} />
                )}
                <span className="videoLabel">You</span>
              </div>
            )}
          </div>

          <div className="callControlPanel">
            <button
              className={`controlBtn ${isMuted ? "active" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2c1.66 0 3 1.34 3 3v7c0 1.66-1.34 3-3 3s-3-1.34-3-3V5c0-1.66 1.34-3 3-3zm7 10h-1.7c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.4 2.7 6.2 6 6.7V22h2v-3.3c3.3-.5 6-3.3 6-6.7z" opacity="0.4"/>
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02 4.13c-.15.02-.3.04-.48.04-2.76 0-5-2.24-5-5V9.3l5.48 5.48-.1.02zM12 2c1.66 0 3 1.34 3 3v5.59l-5.69-5.69C9.72 2.8 10.79 2 12 2zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .3 0 .57-.07.84-.17l2.8 2.8c-.89.65-1.95 1.07-3.14 1.15V21h-2v-3.22c-3.21-.45-5.7-3.2-5.7-6.53H3c0 3.93 3.03 7.18 6.9 7.7V22h6.2l3.63 3.63 1.27-1.27L4.27 3z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.4 2.7 6.2 6 6.7V21h2v-3.3c3.3-.5 6-3.3 6-6.7h-1.7z"/>
                </svg>
              )}
            </button>

            <button
              className={`controlBtn ${isCameraOff ? "active" : ""}`}
              onClick={toggleCamera}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.2l2.78 2.78 1.27-1.27L3.27 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              )}
            </button>

            <button className="controlBtn btnEndCall" onClick={endCall} title="End Call">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c-2.48 0-4.5-2.02-4.5-4.5S10.52 8 13 8s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z" transform="rotate(135 12 12)"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";

export const CallContext = createContext();

export const CallContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);

  const [call, setCall] = useState(null);
  const [callState, setCallState] = useState("idle"); // 'idle' | 'calling' | 'ringing' | 'accepted' | 'rejected' | 'ended'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callRef = useRef(null);
  const callStateRef = useRef("idle");

  // Keep references updated for listener cleanup callbacks
  useEffect(() => {
    callRef.current = call;
  }, [call]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Firestore unsubscription references
  const callDocUnsub = useRef(null);
  const callerCandidatesUnsub = useRef(null);
  const receiverCandidatesUnsub = useRef(null);

  // WebRTC configuration using Google's public STUN servers
  const pcConfig = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302"
        ]
      }
    ]
  };

  // Reset the calling state, close peers, and stop media tracks
  const resetCallState = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (callDocUnsub.current) {
      callDocUnsub.current();
      callDocUnsub.current = null;
    }
    if (callerCandidatesUnsub.current) {
      callerCandidatesUnsub.current();
      callerCandidatesUnsub.current = null;
    }
    if (receiverCandidatesUnsub.current) {
      receiverCandidatesUnsub.current();
      receiverCandidatesUnsub.current = null;
    }

    setIsMuted(false);
    setIsCameraOff(false);
    setCall(null);
    setCallState("idle");
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "calls"),
      where("receiverId", "==", currentUser.uid),
      where("status", "==", "ringing")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        const callData = callDoc.data();

        // If we are currently idle, show the incoming call popup
        if (callStateRef.current === "idle") {
          setCall(callData);
          setCallState("ringing");

          // Start listening to this incoming call document for cancellation/rejection
          const callDocRef = doc(db, "calls", callData.id);
          callDocUnsub.current = onSnapshot(callDocRef, (snap) => {
            const currentData = snap.data();
            if (!currentData) return;

            if (currentData.status === "ended" || currentData.status === "rejected") {
              resetCallState();
            }
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Handle window unload during active calls
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callRef.current && (callStateRef.current === "calling" || callStateRef.current === "accepted" || callStateRef.current === "ringing")) {
        const callDocRef = doc(db, "calls", callRef.current.id);
        updateDoc(callDocRef, { status: "ended" });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Initiate an Outgoing Video Call
  const initiateCall = async (receiverUser) => {
    if (callState !== "idle") return;

    try {
      // 1. Get local webcam and audio media streams
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(pcConfig);
      pcRef.current = pc;

      // Add local media tracks to connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming track events
      const rStream = new MediaStream();
      remoteStreamRef.current = rStream;
      setRemoteStream(rStream);

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          rStream.addTrack(track);
        });
      };

      // 3. Setup Firestore Document
      const callDocRef = doc(collection(db, "calls"));
      const callId = callDocRef.id;

      const callData = {
        id: callId,
        callerId: currentUser.uid,
        callerName: currentUser.displayName || "Anonymous",
        callerPhoto: currentUser.photoURL || "",
        receiverId: receiverUser.uid,
        receiverName: receiverUser.displayName || "",
        receiverPhoto: receiverUser.photoURL || "",
        status: "ringing",
        createdAt: serverTimestamp()
      };

      // 4. Capture Local ICE Candidates and save to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = doc(collection(db, "calls", callId, "callerCandidates"));
          setDoc(candidateRef, event.candidate.toJSON());
        }
      };

      // 5. Create WebRTC Offer and set as local description
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type
      };

      // Upload offer and metadata to Firestore
      await setDoc(callDocRef, { ...callData, offer });

      setCall({ ...callData, offer });
      setCallState("calling");

      // 6. Listen for Receiver's Answer and candidates
      callDocUnsub.current = onSnapshot(callDocRef, async (snapshot) => {
        const snapData = snapshot.data();
        if (!snapData) return;

        if (snapData.status === "accepted" && snapData.answer) {
          setCallState("accepted");
          const answerDescription = new RTCSessionDescription(snapData.answer);
          if (pc.signalingState !== "stable") {
            await pc.setRemoteDescription(answerDescription);
          }
        } else if (snapData.status === "rejected" || snapData.status === "ended") {
          resetCallState();
        }
      });

      // Listen for receiver candidates
      const receiverCandidatesCol = collection(db, "calls", callId, "receiverCandidates");
      receiverCandidatesUnsub.current = onSnapshot(receiverCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch((e) =>
              console.error("Error adding remote receiver candidate:", e)
            );
          }
        });
      });

    } catch (error) {
      console.error("Failed to initiate WebRTC call:", error);
      resetCallState();
    }
  };

  // Accept Incoming Video Call
  const acceptCall = async () => {
    if (callState !== "ringing" || !call) return;

    try {
      const callDocRef = doc(db, "calls", call.id);

      // 1. Get media streams
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(pcConfig);
      pcRef.current = pc;

      // Add local media tracks to connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming track events
      const rStream = new MediaStream();
      remoteStreamRef.current = rStream;
      setRemoteStream(rStream);

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          rStream.addTrack(track);
        });
      };

      // 3. Capture Local ICE Candidates and save to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = doc(collection(db, "calls", call.id, "receiverCandidates"));
          setDoc(candidateRef, event.candidate.toJSON());
        }
      };

      // 4. Accept offer and set remote description
      const offerDescription = new RTCSessionDescription(call.offer);
      await pc.setRemoteDescription(offerDescription);

      // 5. Create WebRTC Answer and set as local description
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        sdp: answerDescription.sdp,
        type: answerDescription.type
      };

      // Write answer to Firestore and change status to 'accepted'
      await updateDoc(callDocRef, {
        answer,
        status: "accepted"
      });

      setCallState("accepted");

      // 6. Listen for remote caller candidates
      const callerCandidatesCol = collection(db, "calls", call.id, "callerCandidates");
      callerCandidatesUnsub.current = onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch((e) =>
              console.error("Error adding remote caller candidate:", e)
            );
          }
        });
      });

    } catch (error) {
      console.error("Failed to accept WebRTC call:", error);
      resetCallState();
    }
  };

  // Reject Incoming Call
  const rejectCall = async () => {
    if (!call) return;
    try {
      const callDocRef = doc(db, "calls", call.id);
      await updateDoc(callDocRef, { status: "rejected" });
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
    resetCallState();
  };

  // End Active/Ongoing Call
  const endCall = async () => {
    if (!call) return;
    try {
      const callDocRef = doc(db, "calls", call.id);
      await updateDoc(callDocRef, { status: "ended" });
    } catch (error) {
      console.error("Error ending call:", error);
    }
    resetCallState();
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };

  // Toggle Camera Feed
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsCameraOff(!videoTracks[0].enabled);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        call,
        callState,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

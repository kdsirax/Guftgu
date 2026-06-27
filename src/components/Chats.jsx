import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../firebase";

const Chats = () => {
  const [users, setUsers] = useState([]);

  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);

  useEffect(() => {
    console.log("Chats component mounted/updated. currentUser.uid:", currentUser?.uid);
    if (!currentUser?.uid) return;

    console.log("Subscribing to users collection query...");
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      let list = [];
      snapshot.forEach((doc) => {
        const u = doc.data();
        if (u.uid !== currentUser.uid) {
          list.push(u);
        }
      });
      console.log("Successfully fetched users list:", list);
      setUsers(list);
    }, (error) => {
      console.error("Firestore onSnapshot error in Chats.jsx:", error);
    });

    return () => {
      unsub();
    };
  }, [currentUser?.uid]);

  const handleSelect = async (user) => {
    const combinedId =
      currentUser.uid > user.uid
        ? currentUser.uid + user.uid
        : user.uid + currentUser.uid;

    try {
      const res = await getDoc(doc(db, "chats", combinedId));

      if (!res.exists()) {
        // Create chat in chats collection
        await setDoc(doc(db, "chats", combinedId), {
          messages: []
        });

        // Initialize userChats metadata
        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [combinedId + ".userInfo"]: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL
          },
          [combinedId + ".date"]: serverTimestamp()
        });

        await updateDoc(doc(db, "userChats", user.uid), {
          [combinedId + ".userInfo"]: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          },
          [combinedId + ".date"]: serverTimestamp()
        });
      }

      dispatch({ type: "CHANGE_USER", payload: user });
    } catch (err) {
      console.error("Error selecting user:", err);
    }
  };

  return (
    <div className="chats">
      {users.map((user) => (
        <div
          className="userChat"
          key={user.uid}
          onClick={() => handleSelect(user)}
        >
          <div className="avatarWrapper">
            <img src={user.photoURL} alt="" />
            {user.isOnline && <span className="onlineDot"></span>}
          </div>
          <div className="userChatInfo">
            <span>{user.displayName}</span>
            <p className={user.isOnline ? "onlineText" : "offlineText"}>
              {user.isOnline ? "online" : "offline"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Chats;

import React, { useState } from 'react';
import Add from "../img/addAvatar.png";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, storage, db } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const[err, setErr] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault();
    const displayName = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    const file = e.target[3].files[0];

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      let downloadURL = "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(displayName);

      if (file) {
        // create a unique image name 
        const date = new Date().getTime();
        const storageRef = ref(storage, `${displayName + date}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        downloadURL = await getDownloadURL(uploadTask.ref);
      }

      // Update Profile 
      await updateProfile(res.user,{
        displayName,
        photoURL: downloadURL,
      });

      // Create user on firestore 
      await setDoc(doc(db, "users", res.user.uid),{
        uid: res.user.uid,
        displayName,
        email,
        photoURL: downloadURL,
      });
      
      await setDoc(doc(db, "userChats", res.user.uid), {});
      navigate("/");

    } catch (err) {
      console.log(err);
      setErr(true);
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user on firestore 
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(user.displayName),
        });

        // Initialize userChats
        await setDoc(doc(db, "userChats", user.uid), {});
      }

      navigate("/");
    } catch (err) {
      console.error(err);
      setErr(true);
    }
  };

  const handleKey = (e) => {
    e.code === "Enter" && handleSubmit();
  };

  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">Guftgu</span>
        <span className="title">Register</span>
        <form onSubmit={handleSubmit} onKeyDown={handleKey}>
          <input type="text" placeholder="display name" />
          <input type="email" placeholder="email" />
          <input type="password" placeholder="password" />
          <input style={{ display: "none" }} type="file" id="file" />
          <label htmlFor="file">
            <img src={Add} alt="" />
            <span>Add an avatar</span>
          </label>
          <button>Sign Up</button>
          <button type="button" className="googleBtn" onClick={handleGoogleAuth}>
            Sign Up with Google
          </button>
          {err && (
            <span style={{ color: "red", fontSize: "12px" }}>
              Something went Wrong!
            </span>
          )}
        </form>
        <p>
          You do have an account?
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register
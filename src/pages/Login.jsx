import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Login = () => {
  const [err, setErr] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
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
        <span className="title">Login</span>
        <form onSubmit={handleSubmit} onKeyDown={handleKey}>
          <input type="email" placeholder="email" />
          <input type="password" placeholder="password" />
          <button>Sign In</button>
          <button type="button" className="googleBtn" onClick={handleGoogleAuth}>
            Sign In with Google
          </button>
          {err && (
            <span style={{ color: "red", fontSize: "12px" }}>
              Something went Wrong!
            </span>
          )}
        </form>
        <p>
          You don't have an account?
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

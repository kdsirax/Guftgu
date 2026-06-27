import { signOut } from 'firebase/auth'
import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { auth, db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'

const Navbar = () => {
  const {currentUser} = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      if (currentUser?.uid) {
        await updateDoc(doc(db, "users", currentUser.uid), { isOnline: false });
      }
    } catch (e) {
      console.error("Error setting offline status on logout:", e);
    }
    signOut(auth);
  };

  return (
    <div className='navbar'>
      <span className="logo">Guftgu</span>
      <div className="user">
        <img src={currentUser.photoURL} alt="" />
        <span>{currentUser.displayName}</span>
        <button onClick={handleLogout}>logout</button>
      </div>
    </div>
  )
}

export default Navbar
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState({});

    useEffect(()=>{
        const onSub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            console.log(user);
            if (user) {
                try {
                    await updateDoc(doc(db, "users", user.uid), { isOnline: true });
                } catch (e) {
                    console.error("Error setting online status:", e);
                }
            }
        });

        return () => {
            onSub();
        }
    },[]);

    useEffect(() => {
        const handleUnload = () => {
            if (auth.currentUser) {
                updateDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false });
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    return (
        <AuthContext.Provider value={{currentUser}}>
            {children}
        </AuthContext.Provider>
    );
}
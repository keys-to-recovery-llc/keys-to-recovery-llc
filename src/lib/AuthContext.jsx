import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
 const [user,setUser]=useState(null),[isLoadingAuth,setLoading]=useState(true),[authError,setError]=useState(null);
 const checkAppState=async()=>{setLoading(true);try{setUser(await auth.me());setError(null);}catch(e){setUser(null);if(e.status!==401)setError({type:'unknown',message:e.message});}finally{setLoading(false);}};
 useEffect(()=>{checkAppState();},[]);
 const logout=async(redirect=true)=>{try{await auth.logout();}finally{setUser(null);if(redirect)window.location.assign('/');}};
 const navigateToLogin=()=>window.location.assign('/Account?returnTo='+encodeURIComponent(window.location.href));
 return <AuthContext.Provider value={{user,isAuthenticated:!!user,isLoadingAuth,isLoadingPublicSettings:false,authError,appPublicSettings:null,logout,navigateToLogin,checkAppState}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);

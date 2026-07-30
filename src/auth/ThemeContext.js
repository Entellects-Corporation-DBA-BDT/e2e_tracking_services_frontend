import { createContext,useContext,useEffect,useMemo,useState } from "react";
const ThemeContext=createContext(null);
const initialTheme=()=>{const saved=localStorage.getItem("e2e-theme");if(saved==="dark"||saved==="light")return saved;return window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light"};
export function ThemeProvider({children}){const [theme,setTheme]=useState(initialTheme);useEffect(()=>{localStorage.setItem("e2e-theme",theme)},[theme]);const value=useMemo(()=>({theme,darkMode:theme==="dark",toggleTheme:()=>setTheme(current=>current==="dark"?"light":"dark"),setTheme}),[theme]);return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>}
export const useTheme=()=>useContext(ThemeContext);
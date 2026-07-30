import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../auth/ThemeContext";
function GlobalThemeToggle(){const {theme}=useTheme();const location=useLocation();useEffect(()=>{const dashboard=location.pathname.startsWith("/dashboard");const dark=dashboard&&theme==="dark";document.documentElement.classList.toggle("e2e-dark",dark);document.documentElement.dataset.theme=dashboard?theme:"light";document.documentElement.style.colorScheme=dark?"dark":"light";return()=>document.documentElement.classList.remove("e2e-dark")},[location.pathname,theme]);return null}
export default GlobalThemeToggle;
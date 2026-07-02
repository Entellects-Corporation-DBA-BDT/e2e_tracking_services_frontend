import { useState } from "react";
import "../styles/LoginForm.css";
import { loginUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";

import {
  FaGoogle,
  FaMicrosoft,
  FaArrowRight,
  FaGlobe,
  FaLock,
  FaUser,
  FaEyeSlash,
  FaShieldAlt,
  FaEye
} from "react-icons/fa";

function LoginForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    setErrorMessage("Please fill in both fields.");
    return;
  }

  setLoading(true);

  try {
    const response = await loginUser({
      email,
      password,
    });

    console.log(response.firstRoute)

    navigate(response.firstRoute, {
      replace: true,
    });

  } catch (error) {
    setErrorMessage(
      error.message || "Login failed. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="loginPage">
      <div className="loginContainer">
        {/* LANGUAGE */}
        <div className="languageWrapper">
          <button className="languageButton">
            <FaGlobe className="languageIcon" />
            English
          </button>
        </div>
        {/* LOGO */}
        <div className="logoSection">
          <img
            src="/logo.png"
            alt="logo"
            className="topLogo"
          />
          <h1 className="companyTitle">E2E TRACKING</h1>
          <h3 className="companySubTitle">SERVICES</h3>
        </div>
        {/* WELCOME */}
        <div className="welcomeSection">
          <h2 className="welcomeTitle">
            Welcome Back!
          </h2>
          <p className="welcomeDescription">
            Login to continue to your account
          </p>
        </div>
        {/* FORM */}
        <form
          className="loginForm"
          onSubmit={handleSubmit}
        >
          {/* USERNAME */}
          <div className="inputGroup">
            <label className="inputLabel">
              Username
            </label>
            <div className="inputWrapper">
              <FaUser className="inputIcon" />
              <input
                type="email"
                name="username"
                placeholder="Enter your email"
                value={email}
                className="inputField"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          {/* PASSWORD */}
          <div className="inputGroup">
            <label className="inputLabel">
              Password
            </label>
            <div className="inputWrapper">
              {/* <FaLock className="inputIcon" /> */}
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="inputField"
                required
              />
              {showPassword ? (
                <FaEye
                  className="eyeIcon"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <FaEyeSlash
                  className="eyeIcon"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>
          {/* OPTIONS */}
          <div className="optionsWrapper">
            <div className="rememberWrapper">
              <input
                type="checkbox"
                className="rememberCheckbox"
              />
              <p className="rememberText">Remember me</p>
            </div>
            <p className="forgotPassword">Forgot Password?</p>
          </div>
          {/* BUTTON */}
          <button className="loginButton">
            {loading ? "Logging in..." : "Login"}
            <FaArrowRight className="buttonArrow" />
          </button>
          {errorMessage && (
            <p className="login-error-message">
              {errorMessage}
            </p>
          )}
          <div className="newRegisterSection">
            <span>
              Don't have an account?
            </span>
            <button
              type="button"
              className="newRegisterBtn"
              onClick={() => navigate("/register")}
            >
              New Register
            </button>
          </div>
        </form>
        {/* DIVIDER */}
        <div className="dividerWrapper">
          <div className="dividerLine"></div>
          <p className="dividerText">or sign in with</p>
          <div className="dividerLine"></div>
        </div>
        {/* SOCIAL LOGIN */}
        <div className="socialWrapper">
          <button className="socialButton">
            <FaGoogle className="googleIcon" />
          </button>
          <button className="socialButton">
            <FaMicrosoft className="microsoftIcon" />
          </button>
          <button className="socialButton ssoButton">
            <FaShieldAlt className="ssoIcon" />
            SSO
          </button>
        </div>
        {/* SECURITY */}
        <div className="securityContainer">
          <div className="securityIconWrapper">
            <FaShieldAlt className="securityIcon" />
          </div>
          <div className="securityContent">
            <h4 className="securityTitle">
              Your security is our priority
            </h4>
            <p className="securityDescription">
              We use enterprise-grade security to protect your data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
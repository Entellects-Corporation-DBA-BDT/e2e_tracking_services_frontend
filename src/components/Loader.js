import React from "react";
import "./Loader.css"

const Loader = () => {
  return (
    <div className="e2e-loader-wrapper">
      <div className="e2e-loader-spinner">
        <div className="circle"></div>
      </div>

      <span className="tfm-loader-text">
        Loading E2E Tracking
      </span>
    </div>
  );
};

export default Loader;
import "../styles/Homepage.css";

import {
  FaUsers,
  FaUserTie,
  FaChartLine,
  FaGraduationCap,
  FaFire,
  FaLaptopCode,
  FaBriefcase,
  FaComments,
  FaHandshake,
  FaIdBadge,
  FaBuilding,
} from "react-icons/fa";

import TotalCandidates from "../components/TotalCandidates";
import ActiveJobs from "../components/ActiveJobs";
import BenchResource from "../components/BenchResource";
import Placements from "../components/Placements";

import LoginForm from "../forms/LoginForm";

function Homepage() {
  return (
    <div className="homePage">
      {/* BACKGROUND OVERLAY */}
      <div className="overlay"></div>

      {/* LEFT SECTION */}
      <div className="leftSection">
        {/* TOP LOGO */}
        <div className="topLogoSection">
          <img src="/logo.png" alt="logo" className="topLogo" />

          <div className="logoContent">
            <h2 className="logoTitle">E2E TRACKING</h2>
            <p className="logoSubTitle">SERVICES</p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="headingSection">
          <h1 className="mainHeading">
            E2E TRACKING
            <span>SERVICES</span>
          </h1>

          <div className="headingLine"></div>

          {/* <p className="descriptionText">
            A complete solution to manage your workforce,
            recruitment and business operations efficiently.
          </p> */}
        </div>

        {/* SERVICE BOX */}
        <div className="serviceBox">
          <h3 className="serviceHeading">OUR SERVICE MODULES</h3>

          <div className="serviceGrid">
            <div className="serviceItem">
              <span className="serviceIcon">
                <FaUsers />
              </span>
              1. Recruiting
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaUserTie />
              </span>
              7. Candidates
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaChartLine />
              </span>
              2. Bench Sales
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaGraduationCap />
              </span>
              8. Training
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaFire />
              </span>
              3. Hot List
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaLaptopCode />
              </span>
              9. Recruiters Interview
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaBriefcase />
              </span>
              4. Jobs
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaComments />
              </span>
              10. Benchsales Interview
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaHandshake />
              </span>
              5. Prime Vendors
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaIdBadge />
              </span>
              11. Employee Status Record
            </div>

            <div className="serviceItem">
              <span className="serviceIcon">
                <FaBuilding />
              </span>
              6. Clients
            </div>
          </div>
        </div>

        {/* BOTTOM CARDS */}
        <div className="bottomCards">
          <TotalCandidates />
          <ActiveJobs />
          <BenchResource />
          <Placements />
        </div>
      </div>

      <div className="aiRobotContainer">
    <img
        src="robot.png"   // your robot image
        alt="AI Robot"
        className="aiRobot"
    />

    <div className="robotShadow"></div>

    <div className="robotGlow"></div>
</div>

      {/* RIGHT SECTION */}
      <div className="rightSection">
        <LoginForm />
      </div>
    </div>
  );
}

export default Homepage;
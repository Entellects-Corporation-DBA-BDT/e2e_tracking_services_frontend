import "../../styles/Dashboard/sidebar.css";
import Cookies from "js-cookie";
import { useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyResources } from "../../api/authApi";
import { FaSignOutAlt } from "react-icons/fa";
import { sidebarConfig } from "./SidebarConfig";
import { createPortal } from "react-dom";

function Sidebar() {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [resourcesCount, setResourcesCount] = useState(null)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    if (!showLogoutConfirmation) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowLogoutConfirmation(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showLogoutConfirmation]);

  const loadResources = async () => {
    try {
      const data = await getMyResources();

      const visibleResources = data.filter(
        (item) => item.can_view === 1
      );

      const hasCandidateAccess = visibleResources.some(
        (item) => item.resource_name === "candidates"
      );
      const hasReminderResource = visibleResources.some(
        (item) => item.resource_name === "document_reminders"
      );

      if (hasCandidateAccess && !hasReminderResource) {
        visibleResources.push({
          id: "document-reminders",
          resource_name: "document_reminders",
          display_name: "Document Reminders",
          // can_view: 1,
        });
      }

      setResources(visibleResources);
      setResourcesCount(data.length)
      
    } catch (error) {
      console.error(error);
    }
  };

  const getClassName = ({ isActive }) =>
    `e2e_sidebar_menu_item ${isActive ? "e2e_sidebar_active" : ""
    }`;

  const handleLogout = () => {
    Cookies.remove("jwtToken");
    navigate("/");
  };

  return (
    <div className="e2e_sidebar_container">
      <div className="e2e_sidebar_content">
        {resourcesCount < 10 && <div className="aiRobotContainer1">
          <img
            src="../../robot.png"   // your robot image
            alt="AI Robot"
            className="aiRobot"
          />

          <div className="robotShadow"></div>

          <div className="robotGlow"></div>
        </div>
}
        <div className="e2e_sidebar_logo_section">
          <img
            src="/logo.png"
            alt="logo"
            className="e2e_sidebar_logo"
          />

          <div>
            <h2>E2E TRACKING</h2>
            <p>SERVICES</p>

          </div>

        </div>

        <div className="e2e_sidebar_menu">

          {resources.map((resource) => {
            const config =
              sidebarConfig[resource.resource_name];

            if (!config) return null;

            return (
              <NavLink
                key={resource.id}
                to={config.route}
                end={config.route === "/dashboard"}
                className={getClassName}
              >
                {config.icon}
                <span>{resource.display_name}</span>
              </NavLink>
            );
          })}

        </div>
      </div>

      <button
        type="button"
        className="e2e_sidebar_logout"
        onClick={() => setShowLogoutConfirmation(true)}
        aria-label="Logout"
      >
        <FaSignOutAlt className="logoutIcon" />
        <span>Logout</span>
      </button>

      {showLogoutConfirmation && createPortal(
        <div
          className="e2e_logout_dialog_backdrop"
          onMouseDown={() => setShowLogoutConfirmation(false)}
        >
          <div
            className="e2e_logout_dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="e2e_logout_dialog_icon" aria-hidden="true">
              <FaSignOutAlt />
            </div>
            <h2 id="logout-dialog-title">Confirm logout</h2>
            <p id="logout-dialog-description">Do you really want to log out?</p>
            <div className="e2e_logout_dialog_actions">
              <button type="button" className="e2e_logout_cancel" onClick={() => setShowLogoutConfirmation(false)} autoFocus>
                Cancel
              </button>
              <button type="button" className="e2e_logout_confirm" onClick={handleLogout}>
                <FaSignOutAlt aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Sidebar;

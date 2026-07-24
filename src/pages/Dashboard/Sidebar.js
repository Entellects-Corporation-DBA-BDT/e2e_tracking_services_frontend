import "../../styles/Dashboard/sidebar.css";
import { useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaShieldAlt, FaSignOutAlt } from "react-icons/fa";
import { sidebarConfig } from "./SidebarConfig";
import { createPortal } from "react-dom";
import { usePermissions } from "../../auth/PermissionContext";

function Sidebar() {
  const navigate = useNavigate();
  const {resources,logout}=usePermissions();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    if (!showLogoutConfirmation) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowLogoutConfirmation(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showLogoutConfirmation]);

  const getClassName = ({ isActive }) =>
    `e2e_sidebar_menu_item ${isActive ? "e2e_sidebar_active" : ""
    }`;

  const handleLogout = () => {
    logout();
    navigate("/",{replace:true});
  };

  return (
    <div className="e2e_sidebar_container">
      <div className="e2e_sidebar_content">
        {resources.length < 10 && <div className="aiRobotContainer1">
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

          {resources.filter(resource=>resource.permissions.view&&resource.route&&resource.resource_type==="PAGE"&&resource.component_key).map((resource) => {
            const config =
              sidebarConfig[resource.resource];

            return (
              <NavLink
                key={resource.id}
                to={resource.route}
                end={resource.route === "/dashboard"}
                className={getClassName}
              >
                {config?.icon||<FaShieldAlt className="menuIcon"/>}
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

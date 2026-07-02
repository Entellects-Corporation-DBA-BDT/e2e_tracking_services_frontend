import "../../styles/Dashboard/sidebar.css";
import Cookies from "js-cookie";
import { useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMyResources } from "../../api/authApi";
import { FaSignOutAlt } from "react-icons/fa";
import { sidebarConfig } from "./SidebarConfig";

function Sidebar() {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [resourcesCount, setResourcesCount] = useState(null)

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await getMyResources();

      const visibleResources = data.filter(
        (item) => item.can_view === 1
      );

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
      <div>
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

      <div
        className="e2e_sidebar_logout"
        onClick={handleLogout}
      >
        <FaSignOutAlt className="logoutIcon" />
        <span>Logout</span>
      </div>
    </div>
  );
}

export default Sidebar;
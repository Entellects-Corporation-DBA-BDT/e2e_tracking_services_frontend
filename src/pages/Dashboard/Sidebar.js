import "../../styles/Dashboard/sidebar.css";
import { NavLink } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";
import { sidebarConfig } from "./SidebarConfig";
import { usePermissions } from "../../auth/PermissionContext";

function Sidebar() {
  const {resources,isAdmin}=usePermissions();

  const getClassName = ({ isActive }) =>
    `e2e_sidebar_menu_item ${isActive ? "e2e_sidebar_active" : ""
    }`;

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

          {resources.filter(resource=>resource.permissions.view&&resource.route&&resource.resource_type==="PAGE"&&resource.component_key
            && (isAdmin || !["clients","prime_vendors"].includes(resource.resource))).map((resource) => {
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

    </div>
  );
}

export default Sidebar;

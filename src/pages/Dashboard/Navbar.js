import "../../styles/Dashboard/navbar.css";
import { FaBell, FaChevronDown, FaMoon, FaPrint, FaRedo, FaSearch, FaSignOutAlt, FaSun } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePermissions } from "../../auth/PermissionContext";
import { sidebarConfig } from "./SidebarConfig";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { resources, user, logout } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("e2e-theme") === "dark");
  const profileRef = useRef(null);

  useEffect(() => {
    const closeSearch = (event) => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("e2e-dark", darkMode);
    localStorage.setItem("e2e-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return resources.filter((item) => item.permissions?.view && item.resource_type === "PAGE" && item.component_key && sidebarConfig[item.resource]).filter((item) =>
      `${item.display_name || ""} ${item.resource || ""}`.replaceAll("_", " ").toLowerCase().includes(query)
    );
  }, [resources, searchTerm]);

  const selectResource = (resource) => {
    navigate(resource.route);
    setSearchTerm("");
    setSearchOpen(false);
    setActiveSuggestion(-1);
  };

  const handleSearchKeyDown = (event) => {
    if (!searchOpen || !searchTerm.trim()) return;
    if (!suggestions.length && event.key !== "Escape") return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      selectResource(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveSuggestion(-1);
    }
  };

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/dashboard/recruiting": "Recruiting",
    "/dashboard/bench-sales": "Bench Sales",
    "/dashboard/bench-sales/performance": "Bench Sales Performance",
    "/dashboard/hotlist": "Hot List",
    "/dashboard/jobs": "Jobs",
    "/dashboard/vendors": "Prime Vendors",
    "/dashboard/clients": "Clients",
    "/dashboard/candidates": "Candidates",
    "/dashboard/document-reminders": "Document Reminders",
    "/dashboard/training": "Training",
    "/dashboard/candidate-onboarding":
      "Candidate Onboarding",
    "/dashboard/employee-status":
      "Employee Status Report",
    "/dashboard/users": "User Management",
    "/dashboard/permissions": "Permission Matrix",
    "/dashboard/vendor-onboarding":
      "Vendor Onboarding",
  };

  const currentPageTitle = location.pathname.startsWith("/dashboard/records/")
    ? "Dashboard Record Details"
    : /^\/dashboard\/recruiting\/\d+$/.test(location.pathname)
      ? "Recruiter Application Details"
      : /^\/dashboard\/bench-sales\/\d+$/.test(location.pathname)
        ? "Bench Sales Application Details"
        : /^\/dashboard\/vendors\/\d+$/.test(location.pathname)
          ? "Prime Vendor Details"
        : /^\/dashboard\/employee-status\/\d+$/.test(location.pathname)
          ? "Employee Identity Details"
        : pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="e2e_navbar_container">
      <div>
        <h2 className="e2e_navbar_title">
          {currentPageTitle}
        </h2>

        <p className="e2e_navbar_subtitle">
          Welcome to E2E Tracking Services
        </p>
      </div>

      <div className="e2e_navbar_right">
        <div className="e2e_navbar_search_wrap" ref={searchRef}>
          <FaSearch className="e2e_navbar_search_icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search your resources..."
            className="e2e_navbar_search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSearchOpen(Boolean(event.target.value.trim()));
              setActiveSuggestion(-1);
            }}
            onFocus={() => setSearchOpen(Boolean(searchTerm.trim()))}
            onKeyDown={handleSearchKeyDown}
            role="combobox"
            aria-label="Search accessible resources"
            aria-expanded={searchOpen}
            aria-controls="resource-search-suggestions"
            aria-autocomplete="list"
          />
          {searchOpen && (
            <div className="e2e_navbar_suggestions" id="resource-search-suggestions" role="listbox">
              {suggestions.length ? suggestions.map((resource, index) => (
                <button type="button" role="option" aria-selected={index === activeSuggestion}
                  className={`e2e_navbar_suggestion ${index === activeSuggestion ? "is-active" : ""}`}
                  key={resource.id || resource.resource}
                  onMouseEnter={() => setActiveSuggestion(index)} onClick={() => selectResource(resource)}>
                  <span className="e2e_navbar_suggestion_icon">{sidebarConfig[resource.resource].icon}</span>
                  <span><strong>{resource.display_name || resource.resource.replaceAll("_", " ")}</strong><small>Open resource</small></span>
                </button>
              )) : <div className="e2e_navbar_no_suggestion">No accessible resource found</div>}
            </div>
          )}
        </div>

        <button type="button" className="e2e_navbar_utility" title="Refresh dashboard"
          onClick={() => window.dispatchEvent(new CustomEvent("e2e-dashboard-refresh"))}>
          <FaRedo />
        </button>
        <button type="button" className="e2e_navbar_utility" title="Print or save dashboard"
          onClick={() => window.print()}>
          <FaPrint />
        </button>
        <button type="button" className="e2e_navbar_utility" title={darkMode ? "Use light theme" : "Use dark theme"}
          onClick={() => setDarkMode((value) => !value)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        <button type="button" className="e2e_navbar_notification" title="Notifications">
          <FaBell />
        </button>

        <div className="e2e_navbar_account" ref={profileRef}>
          <button type="button" className="e2e_navbar_profile" onClick={() => setProfileOpen((value) => !value)}
            aria-label="Open account menu" aria-expanded={profileOpen}>
            <div className="e2e_navbar_avatar">{user?.username?.charAt(0)?.toUpperCase() || "U"}</div>
            <div className="e2e_navbar_profile_info">
              <h4>{user?.username || "User"}</h4>
              <p>{user?.email || "Employee"}</p>
            </div>
            <FaChevronDown className={`e2e_navbar_chevron${profileOpen ? " is-open" : ""}`} />
          </button>
          {profileOpen && (
            <div className="e2e_navbar_account_menu">
              <button type="button" onClick={() => navigate("/dashboard/my-profile")}>
                <span className="e2e_account_initial">{user?.username?.charAt(0)?.toUpperCase() || "U"}</span>
                <span><strong>My profile</strong><small>Account & attendance</small></span>
              </button>
              <button type="button" className="e2e_account_logout" onClick={() => {
                setProfileOpen(false);
                setShowLogoutConfirmation(true);
              }}>
                <FaSignOutAlt /><span><strong>Logout</strong><small>End this session</small></span>
              </button>
            </div>
          )}
        </div>
      </div>
      {showLogoutConfirmation && createPortal(
        <div className="e2e_logout_dialog_backdrop" onMouseDown={() => setShowLogoutConfirmation(false)}>
          <div className="e2e_logout_dialog" role="alertdialog" aria-modal="true"
            aria-labelledby="logout-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="e2e_logout_dialog_icon"><FaSignOutAlt /></div>
            <h2 id="logout-dialog-title">Confirm logout</h2>
            <p>Are you sure you want to end your session?</p>
            <div className="e2e_logout_dialog_actions">
              <button type="button" className="e2e_logout_cancel" onClick={() => setShowLogoutConfirmation(false)}>Cancel</button>
              <button type="button" className="e2e_logout_confirm" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}

export default Navbar;

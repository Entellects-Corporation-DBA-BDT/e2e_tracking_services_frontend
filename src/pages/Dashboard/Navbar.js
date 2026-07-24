import "../../styles/Dashboard/navbar.css";
import { FaBell } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "../../auth/PermissionContext";
import { sidebarConfig } from "./SidebarConfig";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { resources, user } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  useEffect(() => {
    const closeSearch = (event) => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

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

        <div className="e2e_navbar_notification">
          <FaBell />
        </div>

        <button type="button" className="e2e_navbar_profile" onClick={() => navigate("/dashboard/my-profile")} aria-label="Open my employee profile and attendance">
  <div className="e2e_navbar_avatar">
    {user?.username?.charAt(0)?.toUpperCase() || "U"}
  </div>

  <div className="e2e_navbar_profile_info">
    <h4>{user?.username || "User"}</h4>
    <p>{user?.email || "Employee"}</p>
  </div>
</button>
      </div>
    </div>
  );
}

export default Navbar;

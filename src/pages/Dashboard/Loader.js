import "../../styles/Dashboard/loader.css";

function Loader({ fullPage = false }) {
  return (
    <div
      className={`e2e_loader_wrapper ${
        fullPage ? "e2e_loader_fullpage" : ""
      }`}
    >
      <div className="e2e_loader">
        <span className="e2e_loader_dot"></span>
      </div>
    </div>
  );
}

export default Loader;
const ENV = {
    development: {
      baseUrl: "http://localhost/E2E_Tracking",
    },
    production: {
      baseUrl: "http://localhost",
    },
  };
  
  const currentEnv = process.env.REACT_APP_ENV || "development";
  
  export const baseUrl =
    process.env.REACT_APP_API_BASE_URL ||
    ENV[currentEnv]?.baseUrl ||
    ENV.development.baseUrl;

  // Stored file paths already begin with "uploads/".
  export const baseUrlImg = baseUrl;
  

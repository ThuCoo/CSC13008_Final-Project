import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-rose-700 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <Button asChild>
          <a
            href="/"
            className="bg-rose-500 text-white py-2 px-4 rounded-md transition hover:bg-rose-700 hover:underline"
          >
            Return to Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

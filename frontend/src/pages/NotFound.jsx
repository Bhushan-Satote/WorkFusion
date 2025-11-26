import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="font-extrabold text-4xl mb-4">404</h1>
      <p className="text-xl mb-4">Page Not Found</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFound; 
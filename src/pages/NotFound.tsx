import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet as DropletHalf, Home } from 'lucide-react';
import Button from '../components/ui/Button'; // Assuming your Button component is well-designed

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 text-center">
      {/* Icon with a bit more prominence */}
      <DropletHalf className="text-sky-600 dark:text-sky-400 mb-6" size={64} /> 
      
      <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3 sm:text-6xl">
        404
      </h1>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:text-3xl">
        Page Not Found
      </h2>
      
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg leading-relaxed">
        Oops! It looks like the page you're trying to reach doesn't exist or might have been moved.
      </p>
      
      <Link to="/" className="inline-block"> {/* Ensure Link acts as a block for consistent button styling */}
        <Button
          variant="primary"
          icon={<Home size={18} aria-hidden="true" />} // aria-hidden for decorative icon
          className="px-6 py-3 text-lg" // Slightly larger button for 404 page
        >
          Go to Homepage
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
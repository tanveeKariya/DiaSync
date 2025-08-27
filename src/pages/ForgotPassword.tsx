import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react'; // Mail icon from lucide-react (good choice!)
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(''); // Clear previous errors

    try {
      const response = await fetch('https://diasync-ez2f.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Crucial: Check if the response is OK (status in the 200-299 range)
      if (response.ok) {
        setSuccess(true);
      } else {
        // Parse the error message from the backend response
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      // This catch block handles network errors or issues before the request is sent
      console.error('Network or request setup error:', err);
      setError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto p-6 sm:p-8"> {/* Added max-width and padding for better centering */}
      <div className="text-center mb-6">
        <Mail className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-2" /> {/* Added mail icon for visual appeal */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Enter your email to receive password reset instructions.
        </p>
      </div>

      {success ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800">
            <p className="font-semibold mb-1">Password reset email sent!</p>
            <p>Please check your inbox (and spam folder) for instructions to reset your password.</p>
          </div>
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center mt-4"
          >
            <span className="mr-1">&larr;</span> Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div
              className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm"
              role="alert" // Added ARIA role for accessibility
            >
              {error}
            </div>
          )}

          <Input
            label="Email Address" // More descriptive label
            type="email"
            placeholder="your@example.com" // Placeholder for better UX
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            fullWidth
            disabled={isLoading} // Disable input while loading
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading} // Ensure button is disabled while loading
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center text-sm mt-4">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center"
            >
              <span className="mr-1">&larr;</span> Back to Login
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
};

export default ForgotPassword;
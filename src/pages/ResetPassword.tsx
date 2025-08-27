import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true); // State to check token validity initially

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>();
  const password = watch('password'); // Watch password field for confirmPassword validation

  // Effect to check for token presence on component mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No reset token found in the URL. Please use the link from your email.');
      setIsTokenValid(false);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(''); // Clear previous errors

    const token = searchParams.get('token');

    // Double-check token validity before making API call
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      setIsLoading(false);
      setIsTokenValid(false);
      return; // Stop execution
    }

    try {
      const response = await fetch('https://diasync-ez2f.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      // Crucial: Check if the response is OK (status in the 200-299 range)
      if (response.ok) {
        // Password reset successful, navigate to login with a success message
        navigate('/login', {
          state: { message: 'Password reset successful. You can now login with your new password.' }
        });
      } else {
        // Parse the error message from the backend response
        const errorData = await response.json();
        // Backend should send specific messages like 'Invalid token' or 'Token expired'
        setError(errorData.message || 'Failed to reset password. The link might be expired or invalid. Please try again.');
        // If the token is invalid/expired, set isTokenValid to false to prevent further attempts
        if (errorData.message && (errorData.message.includes('token') || errorData.message.includes('expired'))) {
          setIsTokenValid(false);
        }
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
        <Lock className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 mb-2" /> {/* Added lock icon */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      {!isTokenValid ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-800" role="alert">
            {error || 'The password reset link is invalid or has expired. Please request a new one.'}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <a
              href="/forgot-password" // Link to your forgot password page
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center"
            >
              Request a New Reset Link &rarr;
            </a>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div
              className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters, with special character, number, uppercase, lowercase"
            error={errors.password?.message}
            {...register('password', {
              required: 'New password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters long.'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'Password must include uppercase, lowercase, number, and special character.'
              }
            })}
            fullWidth
            disabled={isLoading} // Disable input while loading
          />

          <Input
            label="Confirm New Password" // More descriptive label
            type="password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your new password.',
              validate: value => value === password || 'Passwords do not match.'
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
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      )}
    </Card>
  );
};

export default ResetPassword;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ForgotPassword from './ForgotPassword';  

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Sign in to your DiaSync account
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="Email"
            type="email"
            fullWidth
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            fullWidth
            error={errors.password?.message}
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
            <Link
            to="/ForgotPassword"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
            Forgot password?
            </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          icon={<LogIn size={18} />}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium">
          Create an account
        </Link>
      </div>
    </Card>
  );
};

export default Login;
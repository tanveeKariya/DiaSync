import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  diabetesType: string;
  dateOfDiagnosis: string;
}

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Account</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Join DiaSync to start managing your diabetes smarter
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
            label="Full Name"
            fullWidth
            error={errors.name?.message}
            {...register('name', { 
              required: 'Name is required'
            })}
          />
        </div>

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

        <div>
          <Input
            label="Confirm Password"
            type="password"
            fullWidth
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => 
                value === password || 'Passwords do not match'
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Diabetes Type
          </label>
          <select
            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white dark:bg-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-sky-600 dark:focus:ring-sky-500 sm:text-sm sm:leading-6"
            {...register('diabetesType', { required: 'Diabetes type is required' })}
          >
            <option value="Type 1">Type 1</option>
            <option value="Type 2">Type 2</option>
            <option value="Gestational">Gestational</option>
            <option value="Other">Other</option>
          </select>
          {errors.diabetesType && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.diabetesType.message}</p>
          )}
        </div>

        <div>
          <Input
            label="Date of Diagnosis (Optional)"
            type="date"
            fullWidth
            error={errors.dateOfDiagnosis?.message}
            {...register('dateOfDiagnosis')}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          icon={<UserPlus size={18} />}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium">
          Sign in
        </Link>
      </div>
    </Card>
  );
};

export default Register;
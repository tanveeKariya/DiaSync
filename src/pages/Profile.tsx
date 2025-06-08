import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User as LucideUser, Shield, Bell, Phone, Mail, Heart, Save } from 'lucide-react'; // Renamed User to LucideUser to avoid conflict
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// --- Interfaces for Nested Objects ---
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface DoctorInfo {
  name: string;
  phone: string;
  email: string;
  accessCode: string;
}

interface InsulinType {
  basal: string;
  bolus: string;
}

interface TargetGlucoseRange {
  min: number;
  max: number;
}

interface UserSettings {
  glucoseUnit: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

// --- Extended User Type for useAuth context ---
type ExtendedUser = {
  name?: string;
  email?: string;
  diabetesType?: string;
  dateOfDiagnosis?: string;
  insulinType?: InsulinType;
  targetGlucoseRange?: TargetGlucoseRange;
  emergencyContacts?: EmergencyContact[];
  doctor?: DoctorInfo;
  settings?: UserSettings;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

// --- Form Data Interface (Matches the structure you're submitting) ---
interface ProfileFormData {
  name: string;
  email: string;
  diabetesType: string;
  dateOfDiagnosis: string; // Stored as YYYY-MM-DD string
  insulinType: InsulinType;
  targetGlucoseRange: TargetGlucoseRange;
  emergencyContacts: EmergencyContact[];
  doctor: DoctorInfo;
  settings: UserSettings;
}

const Profile: React.FC = () => {
  const { user: rawUser, updateProfile } = useAuth();
  const user = rawUser as ExtendedUser | null;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // --- Initialize react-hook-form ---
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      diabetesType: user?.diabetesType || 'Type 1',
      dateOfDiagnosis: user?.dateOfDiagnosis ? new Date(user.dateOfDiagnosis).toISOString().split('T')[0] : '',
      insulinType: user?.insulinType || { basal: '', bolus: '' },
      targetGlucoseRange: user?.targetGlucoseRange || { min: 70, max: 180 },
      emergencyContacts: user?.emergencyContacts && user.emergencyContacts.length > 0
        ? user.emergencyContacts.slice(0, 2)
        : [{ name: '', relationship: '', phone: '', email: '' }, { name: '', relationship: '', phone: '', email: '' }],
      doctor: user?.doctor || { name: '', phone: '', email: '', accessCode: '' },
      settings: user?.settings || {
        glucoseUnit: 'mg/dL',
        darkMode: false,
        notificationsEnabled: true
      }
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        diabetesType: user.diabetesType || 'Type 1',
        dateOfDiagnosis: user.dateOfDiagnosis ? new Date(user.dateOfDiagnosis).toISOString().split('T')[0] : '',
        insulinType: user.insulinType || { basal: '', bolus: '' },
        targetGlucoseRange: user.targetGlucoseRange || { min: 70, max: 180 },
        emergencyContacts: user.emergencyContacts && user.emergencyContacts.length > 0
          ? user.emergencyContacts.slice(0, 2)
          : [{ name: '', relationship: '', phone: '', email: '' }, { name: '', relationship: '', phone: '', email: '' }],
        doctor: user.doctor || { name: '', phone: '', email: '', accessCode: '' },
        settings: user.settings || {
          glucoseUnit: 'mg/dL',
          darkMode: false,
          notificationsEnabled: true
        }
      });
    }
  }, [user, reset]);

  // --- Handle Dark Mode Toggle ---
  // Removed toggleTheme usage as it does not exist in AuthContextType.

  // --- Form Submission Handler ---
  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    if (!updateProfile) {
      console.error("updateProfile function is not available in AuthContext.");
      setIsLoading(false);
      return;
    }

    try {
      await updateProfile(data);
      // Optionally, you can show a success message here using another method if needed
    } catch (error: any) {
      console.error('Error updating profile:', error);
      // Optionally, you can show an error message here using another method if needed
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <LucideUser size={16} /> },
    { id: 'medical', label: 'Medical Details', icon: <Heart size={16} /> },
    { id: 'contacts', label: 'Emergency Contacts', icon: <Phone size={16} /> },
    { id: 'settings', label: 'Preferences', icon: <Bell size={16} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <LucideUser className="mr-2 text-sky-600" size={24} />
          Profile Settings
        </h1>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-sky-600 text-sky-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {activeTab === 'personal' && (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-sky-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.name || 'Guest'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {user?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <Input
                label="Full Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
                fullWidth
              />

              <Input
                label="Email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
                fullWidth
              />

              <div>
                <label htmlFor="diabetesType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diabetes Type
                </label>
                <select
                  id="diabetesType"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-gray-800 dark:text-white p-2"
                  {...register('diabetesType')}
                >
                  <option value="Type 1">Type 1</option>
                  <option value="Type 2">Type 2</option>
                  <option value="Gestational">Gestational</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Input
                label="Date of Diagnosis"
                type="date"
                {...register('dateOfDiagnosis')}
                fullWidth
              />
            </div>
          </Card>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Heart className="mr-2 text-red-600" size={20} />
                Insulin Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Basal Insulin Type"
                  {...register('insulinType.basal')}
                  placeholder="e.g., Lantus, Levemir"
                />
                <Input
                  label="Bolus Insulin Type"
                  {...register('insulinType.bolus')}
                  placeholder="e.g., Humalog, Novolog"
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="mr-2 text-green-600" size={20} />
                Target Glucose Range
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum (mg/dL)"
                  type="number"
                  {...register('targetGlucoseRange.min', {
                    valueAsNumber: true,
                    min: { value: 40, message: 'Minimum value is 40' },
                    max: { value: 200, message: 'Maximum value is 200' }
                  })}
                  error={errors.targetGlucoseRange?.min?.message}
                />
                <Input
                  label="Maximum (mg/dL)"
                  type="number"
                  {...register('targetGlucoseRange.max', {
                    valueAsNumber: true,
                    min: { value: 100, message: 'Minimum value is 100' },
                    max: { value: 300, message: 'Maximum value is 300' }
                  })}
                  error={errors.targetGlucoseRange?.max?.message}
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Mail className="mr-2 text-purple-600" size={20} />
                Healthcare Provider
              </h2>
              <div className="space-y-4">
                <Input
                  label="Doctor's Name"
                  {...register('doctor.name')}
                />
                <Input
                  label="Doctor's Phone"
                  {...register('doctor.phone')}
                />
                <Input
                  label="Doctor's Email"
                  type="email"
                  {...register('doctor.email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.doctor?.email?.message}
                />
                <Input
                  label="Access Code"
                  type="text"
                  {...register('doctor.accessCode')}
                  helperText="This code allows your doctor to access your data"
                />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'contacts' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Phone className="mr-2 text-teal-600" size={20} />
              Emergency Contacts
            </h2>
            <div className="space-y-6">
              {[0, 1].map((index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Emergency Contact #{index + 1}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      {...register(`emergencyContacts.${index}.name`)}
                    />
                    <Input
                      label="Relationship"
                      {...register(`emergencyContacts.${index}.relationship`)}
                    />
                    <Input
                      label="Phone"
                      {...register(`emergencyContacts.${index}.phone`)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      {...register(`emergencyContacts.${index}.email`, {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      error={errors.emergencyContacts?.[index]?.email?.message}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="mr-2 text-amber-600" size={20} />
              App Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="glucoseUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Glucose Unit
                </label>
                <select
                  id="glucoseUnit"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-gray-800 dark:text-white p-2"
                  {...register('settings.glucoseUnit')}
                >
                  <option value="mg/dL">mg/dL</option>
                  <option value="mmol/L">mmol/L</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use dark theme for the application
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('settings.darkMode')}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive alerts and reminders
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('settings.notificationsEnabled')}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={<Save size={16} />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

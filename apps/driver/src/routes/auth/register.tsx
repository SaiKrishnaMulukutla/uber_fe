import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { drivers, useSessionStore, getUserId, getRole, getEmail } from '@uber_fe/shared';
import { AuthLayout, Button, Input } from '@uber_fe/ui';
import { UserIcon, MailIcon, LockIcon, PhoneIcon, CarIcon } from '@uber_fe/ui';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type: string;
  license_plate: string;
}

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'auto', label: 'Auto' },
];

export default function Register() {
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: { vehicle_type: '' } });

  const selectedVehicle = watch('vehicle_type');

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await drivers.register(data);
      const userId = getUserId(res.access_token);
      const role = getRole(res.access_token);
      const email = getEmail(res.access_token);
      if (!userId || !role || !email) throw new Error('Invalid token');
      setSession({ accessToken: res.access_token, refreshToken: res.refresh_token, userId, role, email });
      navigate('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      if (msg.includes('409') || msg.toLowerCase().includes('already')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <AuthLayout title="Drive with Uber" subtitle="Create your driver account">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full name"
          placeholder="John Doe"
          leftIcon={<UserIcon />}
          {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          leftIcon={<MailIcon />}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
          })}
          error={errors.email?.message}
        />
        <Input
          label="Phone"
          placeholder="9876543210"
          inputMode="numeric"
          leftIcon={<PhoneIcon />}
          hint="+91 · 10-digit number"
          {...register('phone', {
            required: 'Phone is required',
            pattern: { value: /^\d{10}$/, message: '10-digit number required' },
          })}
          error={errors.phone?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          leftIcon={<LockIcon />}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Minimum 8 characters' },
          })}
          error={errors.password?.message}
        />

        {/* Vehicle type selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Vehicle type</label>
          <div className="flex gap-2 flex-wrap">
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setValue('vehicle_type', v.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                  selectedVehicle === v.value
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            {...register('vehicle_type', { required: 'Select vehicle type' })}
          />
          {errors.vehicle_type && (
            <p className="text-xs text-red-600">{errors.vehicle_type.message}</p>
          )}
        </div>

        <Input
          label="License plate"
          placeholder="MH 01 AB 1234"
          leftIcon={<CarIcon />}
          {...register('license_plate', { required: 'License plate is required' })}
          error={errors.license_plate?.message}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
          Create driver account
        </Button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-black font-semibold underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

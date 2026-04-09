import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { drivers, useSessionStore, getUserId, getRole, getEmail } from '@uber_fe/shared';
import { Button, Input } from '@uber_fe/ui';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type: string;
  license_plate: string;
}

export default function Register() {
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

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
      setError(e instanceof Error ? e.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Driver sign up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="Phone (+91...)" {...register('phone', { required: 'Required' })} error={errors.phone?.message} />
          <Input label="Password" type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} error={errors.password?.message} />
          <Input label="Vehicle type (sedan/suv/hatchback)" {...register('vehicle_type', { required: 'Required' })} error={errors.vehicle_type?.message} />
          <Input label="License plate" {...register('license_plate', { required: 'Required' })} error={errors.license_plate?.message} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full">Create account</Button>
          <p className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-black font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

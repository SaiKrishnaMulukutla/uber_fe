import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { drivers } from '@uber_fe/shared';
import { Button, Input } from '@uber_fe/ui';

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await drivers.login(data);
      navigate('/auth/verify-otp', { state: { email: data.email } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Driver sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password', { required: 'Required' })} error={errors.password?.message} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full">Continue</Button>
          <p className="text-sm text-center text-gray-500">
            No account?{' '}
            <Link to="/auth/register" className="text-black font-medium">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

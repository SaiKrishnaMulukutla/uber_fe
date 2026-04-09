import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { drivers } from '@uber_fe/shared';
import { AuthLayout, Button, Input } from '@uber_fe/ui';
import { MailIcon, LockIcon } from '@uber_fe/ui';

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await drivers.login(data);
      navigate('/auth/verify-otp', { state: { email: data.email } });
    } catch (e) {
      if (e instanceof TypeError && e.message.includes('fetch')) {
        setError('Connection failed. Check your internet.');
      } else {
        const msg = e instanceof Error ? e.message : 'Login failed';
        if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
          setError('Too many attempts. Wait a few minutes.');
        } else {
          setError('Invalid email or password.');
        }
      }
    }
  };

  return (
    <AuthLayout title="Driver sign in" subtitle="Drive with Uber">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<LockIcon />}
          {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
          error={errors.password?.message}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
          Continue
        </Button>

        <p className="text-sm text-center text-gray-500">
          New driver?{' '}
          <Link to="/auth/register" className="text-black font-semibold underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

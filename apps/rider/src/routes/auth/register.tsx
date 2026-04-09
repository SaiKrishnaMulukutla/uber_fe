import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { users, useSessionStore, getUserId, getRole, getEmail } from '@uber_fe/shared';
import { AuthLayout, Button, Input } from '@uber_fe/ui';
import { UserIcon, MailIcon, LockIcon, PhoneIcon } from '@uber_fe/ui';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

function PasswordStrength({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const level = !password ? 0 : hasLength && hasNumber ? 3 : hasLength || hasNumber ? 2 : 1;
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500'];

  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i <= level ? colors[level] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${level === 3 ? 'text-green-600' : level === 2 ? 'text-yellow-600' : 'text-red-500'}`}>
        {labels[level]}
      </span>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const password = watch('password', '');

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await users.register(data);
      const userId = getUserId(res.access_token);
      const role = getRole(res.access_token);
      const email = getEmail(res.access_token);
      if (!userId || !role || !email) throw new Error('Invalid token');
      setSession({ accessToken: res.access_token, refreshToken: res.refresh_token, userId, role, email });
      navigate('/');
    } catch (e) {
      const status = e instanceof Error && 'status' in e ? (e as { status: number }).status : 0;
      if (status === 409) {
        setError('An account with this email already exists.');
      } else {
        setError(e instanceof Error ? e.message : 'Registration failed');
      }
    }
  };

  return (
    <AuthLayout title="Create your account">
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
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            leftIcon={<LockIcon />}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
              validate: (v) => /\d/.test(v) || 'Include at least one number',
            })}
            error={errors.password?.message}
          />
          <PasswordStrength password={password} />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-2">
          Create account
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

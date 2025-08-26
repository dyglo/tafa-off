'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be at most 50 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError();
      await registerUser({
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        password: data.password,
      });
      toast({
        title: 'Welcome to TOff!',
        description: 'Your account has been created successfully.',
      });
      router.push('/chat');
    } catch (error) {
      // Error is handled by the auth store
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6">
            <Logo size="lg" variant="black" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
          <p className="text-secondary">Start your journey with TOff</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className={cn(
                'bg-secondary border-border text-white placeholder:text-muted-foreground',
                errors.email && 'border-red-500 focus:border-red-500'
              )}
              placeholder="Enter your email"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
              Username
            </label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              className={cn(
                'bg-secondary border-border text-white placeholder:text-muted-foreground',
                errors.username && 'border-red-500 focus:border-red-500'
              )}
              placeholder="Choose a username"
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
              Display name
            </label>
            <Input
              id="displayName"
              type="text"
              autoComplete="name"
              className={cn(
                'bg-secondary border-border text-white placeholder:text-muted-foreground',
                errors.displayName && 'border-red-500 focus:border-red-500'
              )}
              placeholder="How should we call you?"
              {...register('displayName')}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(
                  'bg-secondary border-border text-white placeholder:text-muted-foreground pr-10',
                  errors.password && 'border-red-500 focus:border-red-500'
                )}
                placeholder="Create a password"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn(
                  'bg-secondary border-border text-white placeholder:text-muted-foreground pr-10',
                  errors.confirmPassword && 'border-red-500 focus:border-red-500'
                )}
                placeholder="Confirm your password"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-black font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-secondary">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-accent hover:text-accent/90 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

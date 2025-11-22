'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';
import { AlertCircle, Zap, Users, Calendar, TrendingUp, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    language: 'en',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({
      ...formData,
      [name]: newValue,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          language: formData.language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ email: data.error || 'Signup failed' });
        return;
      }

      // Redirect to verification success page
      router.push('/verify-email?email=' + encodeURIComponent(formData.email));
    } catch (err) {
      setErrors({ email: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-ocean relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-floatSlow" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl animate-float" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">
              Join SportsMatch
            </h1>
            <p className="text-xl text-white/90 font-light">
              Your sports community awaits
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 group">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Connect Instantly</h3>
                <p className="text-white/80 text-sm">
                  Join thousands of players and find your perfect match
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Easy Booking</h3>
                <p className="text-white/80 text-sm">
                  Reserve courts and organize games in just a few clicks
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Level Up</h3>
                <p className="text-white/80 text-sm">
                  Track your progress and compete with players at your level
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold">5,000+</div>
                <div className="text-white/70 text-sm">Active Players</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-white/70 text-sm">Sport Centers</div>
              </div>
              <div>
                <div className="text-3xl font-bold">1,000+</div>
                <div className="text-white/70 text-sm">Games/Week</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient-ocean mb-2">
              SportsMatch Tokyo
            </h1>
            <p className="text-slate-600">Join your sports community</p>
          </div>

          <div className="bg-white rounded-3xl shadow-large p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Create Account
              </h2>
              <p className="text-slate-600">
                Start your sports journey today
              </p>
            </div>

            {errors.email && !errors.password && !errors.confirmPassword && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 animate-fadeInDown">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.email}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                fullWidth
                autoComplete="email"
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  fullWidth
                  autoComplete="new-password"
                />
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Password strength</span>
                      <span className={`text-xs font-semibold ${passwordStrength.strength <= 2 ? 'text-red-600' :
                          passwordStrength.strength <= 3 ? 'text-yellow-600' :
                            passwordStrength.strength <= 4 ? 'text-blue-600' :
                              'text-green-600'
                        }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                fullWidth
                autoComplete="new-password"
              />

              <Select
                label="Preferred Language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ja', label: '日本語' },
                ]}
                fullWidth
              />

              {/* Terms and Privacy Agreement */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:text-primary-700 font-medium underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      href="/privacy"
                      className="text-primary-600 hover:text-primary-700 font-medium underline"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                loading={loading}
                className="mt-6"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-700">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-slate-700">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

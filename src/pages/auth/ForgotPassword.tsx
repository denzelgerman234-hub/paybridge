import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { useSmartBack } from '../../hooks/useSmartBack';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const goBack = useSmartBack('/login');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <Card padding="lg" className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-6">Password reset link sent to {email}.</p>
        <Button variant="outline" onClick={goBack}>Back to Sign In</Button>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
      <p className="text-gray-600 mb-6">Enter your email to receive a reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        <button type="button" onClick={goBack} className="text-primary-600 hover:text-primary-700">Back to Sign In</button>
      </p>
    </Card>
  );
}

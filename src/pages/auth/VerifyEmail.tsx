import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mail } from 'lucide-react';

export function VerifyEmail() {
  return (
    <Card padding="lg" className="text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={32} className="text-primary-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
      <p className="text-gray-600 mb-6">
        We sent a verification link to your email. Click the link to activate your account, then sign in.
      </p>
      <Link to="/login"><Button>Go to Sign In</Button></Link>
    </Card>
  );
}

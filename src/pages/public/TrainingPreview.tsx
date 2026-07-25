import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TRAINING_MODULES } from '../../lib/constants';
import { Link } from 'react-router-dom';
import { CheckCircle, Lock } from 'lucide-react';

export function TrainingPreview() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Preview</h1>
        <p className="text-gray-600">Complete these modules during onboarding to become a verified PayBridge worker.</p>
      </div>
      <div className="space-y-3">
        {TRAINING_MODULES.map((mod, i) => (
          <Card key={mod.id} padding="md" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-semibold">
                {i + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{mod.title}</p>
                <p className="text-sm text-gray-500">{mod.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {i === 0 ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <Lock size={20} className="text-gray-300" />
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/apply"><Button>Apply to Start Training</Button></Link>
      </div>
    </div>
  );
}

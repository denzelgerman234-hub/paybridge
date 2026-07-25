import { useState } from 'react';
import { RiVideoLine, RiMessage2Line, RiCalendarEventLine, RiCheckboxCircleLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { ONBOARDING_STEPS } from '../../lib/constants';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';


const SLOTS: Record<string, string[]> = {
  'Mon, Jul 28': ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],
  'Tue, Jul 29': ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],
  'Wed, Jul 30': ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],
};

export function OnboardingInterview() {
  const { profile } = useAppStore();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [format, setFormat] = useState<'video' | 'chat'>('video');
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  const stepIdx = ONBOARDING_STEPS.findIndex(s => s.id === 'interview') + 1;

  async function handleBook() {
    if (!selectedDay || !selectedTime) return;
    setLoading(true);
    await supabase.from('interview_slots').insert({
      worker_id: profile!.id,
      scheduled_at: new Date(`${selectedDay} ${selectedTime}`).toISOString(),
      status: 'scheduled',
    });
    await supabase.from('worker_profiles').update({ onboarding_step: 'bank' }).eq('id', profile!.id);
    setLoading(false);
    setBooked(true);
  }

  if (booked) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(125,201,154,0.15)', border: '1px solid rgba(125,201,154,0.3)' }}>
              <RiCheckboxCircleLine style={{ color: "#7DC99A", fontSize: 32 }} />
            </div>
            <h2 className="text-2xl font-black text-cream mb-2">Interview Booked!</h2>
            <p className="text-cream/50 mb-1">{selectedDay} at {selectedTime}</p>
            <p className="text-sm text-cream/50 mb-6">Format: {format === 'video' ? 'Video Call' : 'Live Chat'}</p>
            <Button className="w-full" size="lg" onClick={() => navigate('/onboarding/bank')}>
              Continue to Bank Setup →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Step {stepIdx} of {ONBOARDING_STEPS.length} — Interview
        </p>
        <h1 className="text-3xl font-black text-cream">Schedule Your Interview</h1>
        <p className="text-cream/50 mt-1">10–15 minute video or live-chat session with our onboarding team.</p>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

      {/* What's covered */}
      <Card padding="md">
        <h3 className="font-bold text-cream mb-3 text-sm">Topics covered:</h3>
        <ul className="space-y-1.5 text-sm text-cream/50">
          {[
            'Identity confirmation',
            'Operating model review (pre-funded model)',
            'Dedicated account requirements',
            'Worker agreement key terms',
            'Your questions',
          ].map(t => (
            <li key={t} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </Card>

      {/* Format */}
      <Card padding="md">
        <p className="text-sm font-semibold text-cream/50 mb-3">Select format:</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'video' as const, icon: RiVideoLine, label: 'Video Call' },
            { id: 'chat'  as const, icon: RiMessage2Line, label: 'Live Chat' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setFormat(id)}
              className={`flex items-center gap-2 p-3 rounded text-sm font-medium border transition-all duration-200 ${
                format === id
                  ? 'bg-primary-500/15 border-primary-500/40 text-cream'
                  : 'border-white/8 text-cream/50 hover:border-gold/30 hover:text-cream'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Slot picker */}
      <Card padding="md">
        <p className="text-sm font-semibold text-cream/50 mb-4 flex items-center gap-2">
          <RiCalendarEventLine size={16} /> Select a time slot:
        </p>
        <div className="space-y-4">
          {Object.entries(SLOTS).map(([day, times]) => (
            <div key={day}>
              <p className="text-xs text-cream/50 font-semibold mb-2">{day}</p>
              <div className="flex flex-wrap gap-2">
                {times.map(t => (
                  <button
                    key={t}
                    onClick={() => { setSelectedDay(day); setSelectedTime(t); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center gap-1 ${
                      selectedDay === day && selectedTime === t
                        ? 'bg-gold/15 border-primary-400 text-gold/80'
                        : 'border-white/8 text-cream/50 hover:border-gold/30 hover:text-cream'
                    }`}
                  >
                    <span style={{color:"#C9A84C",fontSize:14}}>?</span> {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleBook}
        disabled={!selectedDay || !selectedTime}
        loading={loading}
      >
        Confirm Booking
      </Button>
    </div>
  );
}

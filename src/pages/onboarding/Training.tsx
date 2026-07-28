import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeTrainingModules } from '../../lib/onboardingData';
import { useAppStore } from '../../stores/appStore';
import { TRAINING_MODULES, ONBOARDING_STEPS } from '../../lib/constants';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { RiCheckboxCircleLine, RiTimeLine, RiPlayCircleLine, RiLockLine, RiArrowRightLine } from 'react-icons/ri';

const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.45)';
const GOLD  = '#C9A84C';
const SAGE  = '#7DC99A';

export function OnboardingTraining() {
  const { profile, updateOnboardingStep } = useAppStore();
  const navigate    = useNavigate();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [playing, setPlaying]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  function toggleModule(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else { next.add(id); setPlaying(null); }
    setCompleted(next);
  }

  async function handleComplete() {
    setLoading(true);
    try {
      await completeTrainingModules(profile!.id, Array.from(completed));
      updateOnboardingStep('quiz');
      navigate('/onboarding/quiz');
    } finally {
      setLoading(false);
    }
  }

  const stepIdx = ONBOARDING_STEPS.findIndex(s => s.id === 'training') + 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="section-label mb-1">Step {stepIdx} of {ONBOARDING_STEPS.length}</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>Training Center</h1>
        <p className="text-xs mt-0.5" style={{ color: DIM }}>Complete all 4 modules to unlock the quiz. ~15 minutes.</p>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

      <div className="space-y-3">
        {TRAINING_MODULES.map((mod, i) => {
          const isComplete = completed.has(mod.id);
          const isPlaying  = playing === mod.id;
          const isLocked   = i > 0 && !completed.has(TRAINING_MODULES[i - 1].id);

          return (
            <Card key={mod.id} padding="md" hover={!isLocked} className={isLocked ? 'opacity-50' : ''}>
              <div className="flex items-start gap-4">
                {/* Module number / status */}
                <div
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center font-bold text-sm transition-all"
                  style={{
                    background: isComplete ? 'rgba(125,201,154,0.1)' : 'rgba(201,168,76,0.1)',
                    border: `1px solid ${isComplete ? 'rgba(125,201,154,0.3)' : 'rgba(201,168,76,0.25)'}`,
                    borderRadius: 4,
                    color: isComplete ? SAGE : GOLD,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {isComplete
                    ? <RiCheckboxCircleLine style={{ fontSize: 20 }} />
                    : <span>0{i + 1}</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>{mod.title}</h3>
                    <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: DIM }}>
                      <RiTimeLine style={{ fontSize: 12 }} /> {mod.duration}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: DIM }}>{mod.description}</p>

                  {/* Simulated player */}
                  {isPlaying && (
                    <div className="rounded mb-3" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 4 }}>
                      <div className="h-24 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-2" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
                          <p className="text-xs" style={{ color: DIM }}>Playing: {mod.title}...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {!isLocked && !isComplete && (
                      <Button size="sm" variant="secondary" icon={<RiPlayCircleLine style={{ fontSize: 14 }} />}
                        onClick={() => setPlaying(isPlaying ? null : mod.id)}>
                        {isPlaying ? 'Pause' : 'Watch'}
                      </Button>
                    )}
                    {!isLocked && (
                      <Button size="sm" variant={isComplete ? 'ghost' : 'primary'}
                        onClick={() => toggleModule(mod.id)}>
                        {isComplete ? '✓ Completed' : 'Mark Complete'}
                      </Button>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: DIM }}>
                        <RiLockLine style={{ fontSize: 13 }} /> Complete previous module first
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="pt-2">
        <Button
          className="w-full"
          size="lg"
          onClick={handleComplete}
          disabled={completed.size < TRAINING_MODULES.length}
          loading={loading}
          icon={<RiArrowRightLine style={{ fontSize: 15 }} />}
        >
          {completed.size < TRAINING_MODULES.length
            ? `Complete all modules (${completed.size}/${TRAINING_MODULES.length})`
            : 'Proceed to Quiz'}
        </Button>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordQuizAttempt } from '../../lib/onboardingData';
import { useAppStore } from '../../stores/appStore';
import { QUIZ_QUESTIONS, QUIZ_PASS_MIN_CORRECT, QUIZ_TOTAL, ONBOARDING_STEPS } from '../../lib/constants';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';


export function OnboardingQuiz() {
  const { profile, updateOnboardingStep } = useAppStore();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const correct = QUIZ_QUESTIONS.filter((q, i) => answers[i] === q.answer).length;
  const passed = correct >= QUIZ_PASS_MIN_CORRECT;
  const stepIdx = ONBOARDING_STEPS.findIndex(s => s.id === 'quiz') + 1;

  function handleSubmit() {
    if (Object.keys(answers).length < QUIZ_TOTAL) return;
    setSubmitted(true);
  }

  async function handleContinue() {
    setLoading(true);
    try {
      await recordQuizAttempt(profile!.id, Math.round((correct / QUIZ_TOTAL) * 100), passed);
      if (passed) {
        updateOnboardingStep('interview');
        navigate('/onboarding/interview');
      } else {
        setSubmitted(false);
        setAnswers({});
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card padding="lg">
          <div className="text-center mb-6">
            {passed ? (
              <div className="w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(125,201,154,0.15)', border: '1px solid rgba(125,201,154,0.3)' }}>
                <span style={{color:"#7DC99A",fontSize:16}}>?</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span style={{color:"#C8523D",fontSize:16}}>?</span>
              </div>
            )}
            <h1 className="text-2xl font-black text-cream mb-1">
              {passed ? 'Quiz Passed' : 'Not Quite'}
            </h1>
            <p className={`text-lg font-bold ${passed ? 'text-sage' : 'text-red-400'}`}>
              {correct}/{QUIZ_TOTAL} correct
            </p>
            <p className="text-sm text-cream/50 mt-1">
              {passed ? 'Score unlocks your live interview.' : `You need ${QUIZ_PASS_MIN_CORRECT}/${QUIZ_TOTAL} to pass. Review training and try again.`}
            </p>
          </div>

          {/* Show answers */}
          <div className="space-y-3 mb-6">
            {QUIZ_QUESTIONS.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.answer;
              return (
                <div key={i} className={`rounded p-3 border text-sm ${isCorrect ? 'border-emerald-500/20 bg-sage-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <p className="font-medium text-cream mb-1 text-xs">{i + 1}. {q.q}</p>
                  <p className={`text-xs ${isCorrect ? 'text-sage' : 'text-red-400'}`}>
                    {isCorrect ? '✓' : '✗'} {q.options[userAnswer ?? 0]}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-sage mt-0.5">Correct: {q.options[q.answer]}</p>
                  )}
                </div>
              );
            })}
          </div>

          <Button className="w-full" size="lg" loading={loading} onClick={handleContinue}
            variant={passed ? 'primary' : 'secondary'}>
            {passed ? 'Schedule Interview →' : 'Retry Quiz'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Step {stepIdx} of {ONBOARDING_STEPS.length} — Knowledge Check
        </p>
        <h1 className="text-3xl font-black text-cream">6-Question Quiz</h1>
        <p className="text-cream/50 mt-1">
          Pass threshold: {QUIZ_PASS_MIN_CORRECT}/{QUIZ_TOTAL} correct (80%). Unlimited attempts.
        </p>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

      <div className="space-y-4">
        {QUIZ_QUESTIONS.map((q, i) => (
          <Card key={i} padding="md" className={answers[i] !== undefined ? 'border-gold/20' : ''}>
            <p className="font-semibold text-cream mb-4 text-sm">
              <span className="text-gold font-black mr-2">{i + 1}.</span>{q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, j) => (
                <label
                  key={j}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all duration-200 ${
                    answers[i] === j
                      ? 'bg-primary-500/15 border border-primary-500/40 text-cream'
                      : 'hover:bg-white/5 border border-transparent text-cream/50 hover:text-cream'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    answers[i] === j ? 'border-primary-400 bg-primary-400' : 'border-[#a8a4c4]'
                  }`}>
                    {answers[i] === j && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    className="hidden"
                    checked={answers[i] === j}
                    onChange={() => setAnswers({ ...answers, [i]: j })}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {Object.keys(answers).length < QUIZ_TOTAL && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <span style={{color:"#C9A84C",fontSize:16}}>!</span>
          Answer all {QUIZ_TOTAL} questions to submit
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < QUIZ_TOTAL}
      >
        Submit Quiz
      </Button>
    </div>
  );
}


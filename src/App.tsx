import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Layouts
import { PublicLayout }    from './components/layout/PublicLayout';
import { AuthLayout }      from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout }     from './components/layout/AdminLayout';

// Public pages
import { LandingPage }         from './components/landing/LandingPage';
import { ApplyPage }           from './pages/ApplyPage';
import { FAQPage }             from './pages/FAQPage';
import { ContactPage }         from './pages/ContactPage';
import { TrainingPreviewPage } from './pages/TrainingPreviewPage';
import { PrivacyPage }         from './pages/static/Privacy';
import { TermsPage }           from './pages/static/Terms';
import { CodeOfConduct }       from './pages/static/CodeOfConduct';

// Auth pages
import { Login }          from './pages/auth/Login';
import { Signup }         from './pages/auth/Signup';
import { VerifyEmail }    from './pages/auth/VerifyEmail';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { AuthCallback }   from './pages/auth/AuthCallback';

// Onboarding
import { OnboardingProfile }  from './pages/onboarding/Profile';
import { OnboardingTraining } from './pages/onboarding/Training';
import { OnboardingQuiz }     from './pages/onboarding/Quiz';
import { OnboardingInterview }from './pages/onboarding/Interview';
import { OnboardingBank }     from './pages/onboarding/Bank';
import { OnboardingPayout }   from './pages/onboarding/Payout';

// Dashboard
import { DashboardPage }    from './pages/dashboard/DashboardPage';
import { GigsPage }         from './pages/gigs/GigsPage';
import { GigDetail }        from './pages/gigs/GigDetail';
import { WalletPage as RecordsPage } from './pages/WalletPage';
import { BadgesPage }       from './pages/BadgesPage';
import { AccountPage }      from './pages/AccountPage';
import { ActivityPage }     from './pages/ActivityPage';
import { SupportPage }      from './pages/SupportPage';
import { TrainingPage }     from './pages/TrainingPage';

// Admin
import { AdminLogin }        from './pages/admin/AdminLogin';
import { AdminOverview }     from './pages/admin/AdminOverview';
import { AdminApplications } from './pages/admin/AdminApplications';
import { AdminWorkers }      from './pages/admin/AdminWorkers';
import { AdminGigs }         from './pages/admin/AdminGigs';
import { AdminDisbursements }from './pages/admin/AdminDisbursements';
import { AdminInbox }        from './pages/admin/AdminInbox';
import { AdminOperations }   from './pages/admin/AdminOperations';
import { AdminCommissions }  from './pages/admin/AdminCommissions';
import { AdminCompliance }   from './pages/admin/AdminCompliance';
import { useAdminStore }     from './stores/adminStore';

// Route guards

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner text="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  if (isLoading) return <LoadingSpinner text="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdminAuth, isAdminLoading, initAdminSession } = useAdminStore();

  useEffect(() => {
    initAdminSession();
  }, [initAdminSession]);

  if (isAdminLoading) return <LoadingSpinner text="Checking admin access..." />;
  if (!isAdminAuth) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

// App

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1c35',
            color: '#f8f8ff',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/"                element={<LandingPage />} />
          <Route path="/apply"           element={<ApplyPage />} />
          <Route path="/faq"             element={<FAQPage />} />
          <Route path="/contact"         element={<ContactPage />} />
          <Route path="/training-preview"element={<TrainingPreviewPage />} />
          <Route path="/privacy"         element={<PrivacyPage />} />
          <Route path="/terms"           element={<TermsPage />} />
          <Route path="/code-of-conduct" element={<CodeOfConduct />} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          {/*
           * /auth/callback - Supabase email verification redirect target.
           * Must also be configured in Supabase dashboard:
           *   Authentication -> URL Configuration -> Redirect URLs
           *   Add: <your-domain>/auth/callback
           */}
          <Route path="/auth/callback"   element={<AuthCallback />} />
        </Route>

        {/* Onboarding */}
        <Route element={<OnboardingRoute><DashboardLayout /></OnboardingRoute>}>
          <Route path="/onboarding/profile"   element={<OnboardingProfile />} />
          <Route path="/onboarding/training"  element={<OnboardingTraining />} />
          <Route path="/onboarding/quiz"      element={<OnboardingQuiz />} />
          <Route path="/onboarding/interview" element={<OnboardingInterview />} />
          <Route path="/onboarding/bank"      element={<OnboardingBank />} />
          <Route path="/onboarding/payout"    element={<OnboardingPayout />} />
        </Route>

        {/* Protected dashboard */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/gigs"           element={<Navigate to="/gigs/available" replace />} />
          <Route path="/gigs/available" element={<GigsPage tab="available" />} />
          <Route path="/gigs/active"    element={<GigsPage tab="active" />} />
          <Route path="/gigs/:id"       element={<GigDetail />} />
          <Route path="/records"        element={<RecordsPage />} />
          <Route path="/wallet"         element={<Navigate to="/records" replace />} />
          <Route path="/badges"         element={<BadgesPage />} />
          <Route path="/training"       element={<TrainingPage />} />
          <Route path="/activity"       element={<ActivityPage />} />
          <Route path="/account"        element={<AccountPage />} />
          <Route path="/support"        element={<SupportPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin"               element={<AdminOverview />} />
          <Route path="/admin/applications"  element={<AdminApplications />} />
          <Route path="/admin/workers"       element={<AdminWorkers />} />
          <Route path="/admin/gigs"          element={<AdminGigs />} />
          <Route path="/admin/disbursements" element={<AdminDisbursements />} />
          <Route path="/admin/inbox"         element={<AdminInbox />} />
          <Route path="/admin/operations"    element={<AdminOperations />} />
          <Route path="/admin/commissions"   element={<AdminCommissions />} />
          <Route path="/admin/compliance"    element={<AdminCompliance />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

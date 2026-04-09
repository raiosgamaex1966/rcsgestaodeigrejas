import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { TrialGuard } from "@/components/guards/TrialGuard";
import { SuperAdminGuard } from "@/components/guards/SuperAdminGuard";

// Lazy Pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Bible = lazy(() => import("./pages/Bible"));
const BibleChapter = lazy(() => import("./pages/BibleChapter"));
const BibleBook = lazy(() => import("./pages/BibleBook"));
const Sermons = lazy(() => import("./pages/Sermons"));
const SermonDetail = lazy(() => import("./pages/SermonDetail"));
const CreateSermon = lazy(() => import("./pages/CreateSermon"));
const RecordSermon = lazy(() => import("./pages/RecordSermon"));
const Events = lazy(() => import("./pages/Events"));
const PublicEvent = lazy(() => import("./pages/PublicEvent"));
const Gallery = lazy(() => import("./pages/Gallery"));
const GalleryAlbum = lazy(() => import("./pages/GalleryAlbum"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const ReadingPlans = lazy(() => import("./pages/ReadingPlans"));
const PlanDetail = lazy(() => import("./pages/PlanDetail"));
const PlanInfo = lazy(() => import("./pages/PlanInfo"));
const PlanDevotional = lazy(() => import("./pages/PlanDevotional"));
const PlanVerse = lazy(() => import("./pages/PlanVerse"));
const Offerings = lazy(() => import("./pages/Offerings"));
const MyContributions = lazy(() => import("./pages/MyContributions"));
const Visitors = lazy(() => import("./pages/Visitors"));
const Requests = lazy(() => import("./pages/Requests"));
const BecomeMember = lazy(() => import("./pages/BecomeMember"));
const Transparency = lazy(() => import("./pages/Transparency"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const TrialExpired = lazy(() => import("./pages/TrialExpired"));
const PublicJoin = lazy(() => import("./pages/PublicJoin"));

// Admin Layout & Core
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// Admin Members Sub-routes
const AdminMembersOverview = lazy(() => import("./pages/admin/AdminMembersOverview"));
const AdminMembersList = lazy(() => import("./pages/admin/AdminMembersList"));
const AdminVisitors = lazy(() => import("./pages/admin/AdminVisitors"));
const AdminNewConverts = lazy(() => import("./pages/admin/AdminNewConverts"));
const AdminBirthdays = lazy(() => import("./pages/admin/AdminBirthdays"));
const AdminCells = lazy(() => import("./pages/admin/AdminCells"));
const AdminTeams = lazy(() => import("./pages/admin/AdminTeams"));
const AdminPastoralCare = lazy(() => import("./pages/admin/AdminPastoralCare"));
const AdminJourneys = lazy(() => import("./pages/admin/AdminJourneys"));
const AdminMemberHistory = lazy(() => import("./pages/admin/AdminMemberHistory"));
const AdminMembersReports = lazy(() => import("./pages/admin/AdminMembersReports"));

import { AppLayout } from "./components/layout/AppLayout";

// Admin Financial Sub-routes
const AdminFinancialDashboard = lazy(() => import("./pages/admin/AdminFinancialDashboard"));
const AdminIncomeEntries = lazy(() => import("./pages/admin/AdminIncomeEntries"));
const AdminExpenseEntries = lazy(() => import("./pages/admin/AdminExpenseEntries"));
const AdminExpenseApprovals = lazy(() => import("./pages/admin/AdminExpenseApprovals"));
const AdminFinancialReports = lazy(() => import("./pages/admin/AdminFinancialReports"));
const AdminFinancialAudit = lazy(() => import("./pages/admin/AdminFinancialAudit"));
const AdminFinancialAccounts = lazy(() => import("./pages/admin/AdminFinancialAccounts"));
const AdminFinancialCategories = lazy(() => import("./pages/admin/AdminFinancialCategories"));

// Admin Content routes
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminPhotoAlbums = lazy(() => import("./pages/admin/AdminPhotoAlbums"));
const AdminPhotoAlbumDetail = lazy(() => import("./pages/admin/AdminPhotoAlbumDetail"));
const AdminSermons = lazy(() => import("./pages/admin/AdminSermons"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminEventCategories = lazy(() => import("./pages/admin/AdminEventCategories"));
const AdminEventDetail = lazy(() => import("./pages/admin/AdminEventDetail"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminCourseCategories = lazy(() => import("./pages/admin/AdminCourseCategories"));
const AdminRequests = lazy(() => import("./pages/admin/AdminRequests"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns"));
const AdminPreachers = lazy(() => import("./pages/admin/AdminPreachers"));
const AdminThemes = lazy(() => import("./pages/admin/AdminThemes"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminPlanDays = lazy(() => import("./pages/admin/AdminPlanDays"));
const AdminAchievements = lazy(() => import("./pages/admin/AdminAchievements"));

// Admin System routes
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminChurchSettings = lazy(() => import("./pages/admin/AdminChurchSettings"));
const AdminPix = lazy(() => import("./pages/admin/AdminPix"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminAppearance = lazy(() => import("./pages/admin/AdminAppearance"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminPWA = lazy(() => import("./pages/admin/AdminPWA"));

// Super Admin Layout & Pages
const SuperAdminLayout = lazy(() => import("./pages/superadmin/SuperAdminLayout"));
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
const AdminMemberApprovals = lazy(() => import("./pages/admin/AdminMemberApprovals"));
const SuperAdminChurches = lazy(() => import("./pages/superadmin/SuperAdminChurches"));
const SuperAdminPlans = lazy(() => import("./pages/superadmin/SuperAdminPlans"));
const SuperAdminInvites = lazy(() => import("./pages/superadmin/SuperAdminInvites"));
const SuperAdminFinancial = lazy(() => import("./pages/superadmin/SuperAdminFinancial"));
const SuperAdminRetention = lazy(() => import("./pages/superadmin/SuperAdminRetention"));
const SuperAdminContracts = lazy(() => import("./pages/superadmin/SuperAdminContracts"));
const SuperAdminSettings = lazy(() => import("./pages/superadmin/SuperAdminSettings"));
const SuperAdminAudit = lazy(() => import("./pages/superadmin/SuperAdminAudit"));
const SuperAdminAlerts = lazy(() => import("./pages/superadmin/SuperAdminAlerts"));
const SuperAdminSecurity = lazy(() => import("./pages/superadmin/SuperAdminSecurity"));
const SuperAdminMap = lazy(() => import("./pages/superadmin/SuperAdminMap"));
const SuperAdminGateway = lazy(() => import("./pages/superadmin/SuperAdminGateway"));

import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { ApprovalGuard } from "./components/guards/ApprovalGuard";

// Componente para redirecionar rotas sem slug para a rota correta do inquilino
function RootRedirect() {
  const { user, tenant, loading, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (tenant?.slug) {
          // Se estamos no /app ou /admin sem slug, redirecionamos para a igreja correta
          const path = location.pathname;
          let targetPath = `/app/${tenant.slug}`;
          
          if (path.startsWith('/admin')) {
            targetPath = `/app/${tenant.slug}${path}`;
          } else if (path !== '/' && path !== '/app') {
            targetPath = `/app/${tenant.slug}${path}`;
          }
          
          if (location.pathname !== targetPath) {
            navigate(targetPath + location.search, { replace: true });
          }
        } else if (userRole === 'owner') {
          // Se for owner e não tiver inquilino (Super Admin Global), vai para superadmin
          if (!location.pathname.startsWith('/superadmin')) {
            navigate('/superadmin' + location.search, { replace: true });
          }
        } else {
          // Usuário logado mas sem igreja vinculada (não deveria acontecer exceto em erro de dados)
          // Redireciona para login mas SEM deslogar, para que possamos mostrar uma mensagem ou aguardar
          console.warn("Usuário logado sem slug de inquilino.");
          if (location.pathname !== '/auth') {
            navigate('/auth' + location.search, { replace: true });
          }
        }
      } else {
        // Se não está logado e tenta acessar admin ou app, vai para auth
        if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/app')) {
          navigate('/auth' + location.search, { replace: true });
        }
      }
    }
  }, [user, tenant, loading, navigate, location.pathname, userRole]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background animate-fade-in">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain opacity-50" />
        </div>
      </div>
      <p className="text-muted-foreground animate-pulse text-sm font-medium">Preparando ambiente...</p>
    </div>
  );
}

// Componente de navegação customizado que preserva parâmetros de query
function NavigateWithParams({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={to + location.search} replace />;
}

// Wrapper para resolver o tenant pelo slug da URL
function TenantRouteWrapper({ children }: { children: React.ReactNode }) {
  const { churchSlug } = useParams();
  const { resolveTenantBySlug } = useAuth();

  useEffect(() => {
    if (churchSlug) {
      resolveTenantBySlug(churchSlug);
    }
  }, [churchSlug, resolveTenantBySlug]);

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <p className="text-muted-foreground text-sm font-medium animate-pulse">Carregando portal...</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<NavigateWithParams to="/auth" />} />
            
            {/* Rotas de Visitante por Igreja */}
            <Route path="/:churchSlug">
              <Route index element={<Navigate to="auth" replace />} />
              <Route path="visitante" element={<Navigate to="auth" replace />} />
              <Route path="auth" element={<TenantRouteWrapper><Auth /></TenantRouteWrapper>} />
              <Route path="join" element={<TenantRouteWrapper><PublicJoin /></TenantRouteWrapper>} />
              <Route path="events/:id" element={<TenantRouteWrapper><PublicEvent /></TenantRouteWrapper>} />
            </Route>

            {/* Rotas Legais/Globais */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/trial-expired" element={<TrialExpired />} />

            {/* Rotas de Membros (Logado e com Slug) */}
            <Route path="/app/:churchSlug" element={<TenantRouteWrapper><ApprovalGuard><TrialGuard /></ApprovalGuard></TenantRouteWrapper>}>
              <Route element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="bible">
                  <Route index element={<Bible />} />
                  <Route path=":bookId" element={<BibleBook />} />
                  <Route path=":bookId/:chapter" element={<BibleChapter />} />
                </Route>
                <Route path="sermons">
                  <Route index element={<Sermons />} />
                  <Route path=":id" element={<SermonDetail />} />
                  <Route path="create" element={<CreateSermon />} />
                </Route>
                <Route path="record" element={<RecordSermon />} />
                <Route path="events">
                  <Route index element={<Events />} />
                  <Route path=":id" element={<PublicEvent />} />
                </Route>
                <Route path="gallery">
                  <Route index element={<Gallery />} />
                  <Route path=":id" element={<GalleryAlbum />} />
                </Route>
                <Route path="courses">
                  <Route index element={<Courses />} />
                  <Route path=":id" element={<CourseDetail />} />
                </Route>
                <Route path="plans">
                  <Route index element={<ReadingPlans />} />
                  <Route path=":id" element={<PlanDetail />} />
                  <Route path=":id/info" element={<PlanInfo />} />
                  <Route path=":id/devotional" element={<PlanDevotional />} />
                  <Route path=":id/verse" element={<PlanVerse />} />
                </Route>
                <Route path="offerings" element={<Offerings />} />
                <Route path="contributions" element={<MyContributions />} />
                <Route path="visitors" element={<Visitors />} />
                <Route path="requests" element={<Requests />} />
                <Route path="become-member" element={<BecomeMember />} />
                <Route path="transparency" element={<Transparency />} />
                <Route path="install" element={<Install />} />
              </Route>

              {/* Admin Routes (Nested within church Slug for consistency) */}
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                
                <Route path="members">
                  <Route index element={<AdminMembersOverview />} />
                  <Route path="list" element={<AdminMembersList />} />
                  <Route path="approvals" element={<AdminMemberApprovals />} />
                  <Route path="visitors" element={<AdminVisitors />} />
                  <Route path="new-converts" element={<AdminNewConverts />} />
                  <Route path="birthdays" element={<AdminBirthdays />} />
                  <Route path="cells" element={<AdminCells />} />
                  <Route path="teams" element={<AdminTeams />} />
                  <Route path="pastoral-care" element={<AdminPastoralCare />} />
                  <Route path="journeys" element={<AdminJourneys />} />
                  <Route path="history" element={<AdminMemberHistory />} />
                  <Route path="reports" element={<AdminMembersReports />} />
                </Route>

                <Route path="financial">
                  <Route index element={<AdminFinancialDashboard />} />
                  <Route path="income" element={<AdminIncomeEntries />} />
                  <Route path="expenses" element={<AdminExpenseEntries />} />
                  <Route path="approvals" element={<AdminExpenseApprovals />} />
                  <Route path="reports" element={<AdminFinancialReports />} />
                  <Route path="audit" element={<AdminFinancialAudit />} />
                  <Route path="accounts" element={<AdminFinancialAccounts />} />
                  <Route path="categories" element={<AdminFinancialCategories />} />
                </Route>

                <Route path="banners" element={<AdminBanners />} />
                <Route path="photos">
                  <Route index element={<AdminPhotoAlbums />} />
                  <Route path=":id" element={<AdminPhotoAlbumDetail />} />
                </Route>
                <Route path="sermons" element={<AdminSermons />} />
                <Route path="events">
                  <Route index element={<AdminEvents />} />
                  <Route path="categories" element={<AdminEventCategories />} />
                  <Route path=":id" element={<AdminEventDetail />} />
                </Route>
                <Route path="courses">
                  <Route index element={<AdminCourses />} />
                  <Route path="categories" element={<AdminCourseCategories />} />
                </Route>
                <Route path="requests" element={<AdminRequests />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="preachers" element={<AdminPreachers />} />
                <Route path="themes" element={<AdminThemes />} />
                <Route path="plans">
                  <Route index element={<AdminPlans />} />
                  <Route path=":id" element={<AdminPlanDays />} />
                </Route>
                <Route path="achievements" element={<AdminAchievements />} />

                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminChurchSettings />} />
                <Route path="pix" element={<AdminPix />} />
                <Route path="ai" element={<AdminAI />} />
                <Route path="appearance" element={<AdminAppearance />} />
                <Route path="seo" element={<AdminSEO />} />
                <Route path="pwa" element={<AdminPWA />} />
              </Route>
            </Route>

            {/* Global Redirect if authenticated but at root */}
            <Route path="/app" element={<RootRedirect />} />
            <Route path="/admin/*" element={<RootRedirect />} />
            <Route path="/bible/*" element={<RootRedirect />} />
            <Route path="/sermons/*" element={<RootRedirect />} />
            <Route path="/events/*" element={<RootRedirect />} />
            <Route path="/gallery/*" element={<RootRedirect />} />
            <Route path="/profile" element={<RootRedirect />} />
            <Route path="/settings" element={<RootRedirect />} />

            {/* Super Admin Routes (Keep Global for now) */}
            <Route element={<SuperAdminGuard />}>
              <Route path="/superadmin" element={<SuperAdminLayout />}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="churches" element={<SuperAdminChurches />} />
                <Route path="plans" element={<SuperAdminPlans />} />
                <Route path="invites" element={<SuperAdminInvites />} />
                <Route path="financial" element={<SuperAdminFinancial />} />
                <Route path="retention" element={<SuperAdminRetention />} />
                <Route path="contracts" element={<SuperAdminContracts />} />
                <Route path="alerts" element={<SuperAdminAlerts />} />
                <Route path="settings" element={<SuperAdminSettings />} />
                <Route path="audit" element={<SuperAdminAudit />} />
                <Route path="security" element={<SuperAdminSecurity />} />
                <Route path="map" element={<SuperAdminMap />} />
                <Route path="gateway" element={<SuperAdminGateway />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

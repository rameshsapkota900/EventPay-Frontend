import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { PageTransition } from '@/components/layout/page-transition'

// Pages
import LoginPage from '@/pages/login'
import SuperAdminDashboard from '@/pages/super-admin/dashboard'
import SuperAdminOrganizations from '@/pages/super-admin/organizations'
import SuperAdminUsers from '@/pages/super-admin/users'
import SuperAdminReports from '@/pages/super-admin/reports'
import OrgAdminDashboard from '@/pages/org-admin/dashboard'
import OrgAdminEvents from '@/pages/org-admin/events'
import OrgAdminStalls from '@/pages/org-admin/stalls'
import OrgAdminStudents from '@/pages/org-admin/students'
import OrgAdminVolunteers from '@/pages/org-admin/volunteers'
import OrgAdminTransactions from '@/pages/org-admin/transactions'
import OrgAdminUsers from '@/pages/org-admin/users'
import OrgAdminReports from '@/pages/org-admin/reports'
import StallOwnerDashboard from '@/pages/stall-owner/dashboard'
import StallOwnerTransactions from '@/pages/stall-owner/transactions'
import StallOwnerProfile from '@/pages/stall-owner/profile'
import StallOwnerPayStudent from '@/pages/stall-owner/pay-student'
import VolunteerDashboard from '@/pages/volunteer/dashboard'
import VolunteerRegister from '@/pages/volunteer/register'
import VolunteerTransactions from '@/pages/volunteer/transactions'
import StudentDashboard from '@/pages/student/dashboard'
import StudentPay from '@/pages/student/pay'
import OrganizationSetupPage from '@/pages/organization-setup'
import ForgotPasswordPage from '@/pages/forgot-password'
import ResetPasswordPage from '@/pages/reset-password'

import StudentTransactions from '@/pages/student/transactions'
import StudentProfile from '@/pages/student/profile'

// Layouts
import { DashboardLayout } from '@/components/layout/dashboard-layout'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return (
    <DashboardLayout>
      <PageTransition>{children}</PageTransition>
    </DashboardLayout>
  )
}

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/organization-setup" element={<PageTransition><OrganizationSetupPage /></PageTransition>} />
      <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
      <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
      
      {/* Root redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={`/${user.role.toLowerCase().replace('_', '-')}/dashboard`} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Super Admin Routes */}
      <Route path="/super-admin/dashboard" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/organizations" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminOrganizations />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/users" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/reports" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminReports />
        </ProtectedRoute>
      } />

      {/* Org Admin Routes */}
      <Route path="/org-admin/dashboard" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/events" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminEvents />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/stalls" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminStalls />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/students" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminStudents />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/volunteers" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminVolunteers />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/transactions" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminTransactions />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/users" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/org-admin/reports" element={
        <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
          <OrgAdminReports />
        </ProtectedRoute>
      } />

      {/* Stall Owner Routes */}
      <Route path="/stall-owner/dashboard" element={
        <ProtectedRoute allowedRoles={['STALL_OWNER']}>
          <StallOwnerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/stall-owner/transactions" element={
        <ProtectedRoute allowedRoles={['STALL_OWNER']}>
          <StallOwnerTransactions />
        </ProtectedRoute>
      } />
      <Route path="/stall-owner/profile" element={
        <ProtectedRoute allowedRoles={['STALL_OWNER']}>
          <StallOwnerProfile />
        </ProtectedRoute>
      } />
      <Route path="/stall-owner/pay-student" element={
        <ProtectedRoute allowedRoles={['STALL_OWNER']}>
          <StallOwnerPayStudent />
        </ProtectedRoute>
      } />

      {/* Volunteer Routes */}
      <Route path="/volunteer/dashboard" element={
        <ProtectedRoute allowedRoles={['VOLUNTEER']}>
          <VolunteerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/volunteer/register" element={
        <ProtectedRoute allowedRoles={['VOLUNTEER']}>
          <VolunteerRegister />
        </ProtectedRoute>
      } />
      <Route path="/volunteer/transactions" element={
        <ProtectedRoute allowedRoles={['VOLUNTEER']}>
          <VolunteerTransactions />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/pay" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentPay />
        </ProtectedRoute>
      } />

      <Route path="/student/transactions" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentTransactions />
        </ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentProfile />
        </ProtectedRoute>
      } />

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

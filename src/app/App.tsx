import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { queryClient } from "@/shared/api/queryClient";
import { AuthProvider } from "@/auth/AuthContext";
import { AuthGuard } from "@/auth/AuthGuard";
import { LoginPage } from "@/auth/LoginPage";
import { RequestOwnerAccessPage } from "@/auth/RequestOwnerAccessPage";
import { AdminDashboardPage } from "@/features/admin/AdminDashboardPage";
import { OwnerDashboardPage } from "@/features/owner/OwnerDashboardPage";
import { PartyCreatePage } from "@/features/owner/PartyCreatePage";
import { PartyEditPage } from "@/features/owner/PartyEditPage";
import { PartyParticipantsPage } from "@/features/owner/PartyParticipantsPage";
import { PartyExclusionsPage } from "@/features/owner/PartyExclusionsPage";
import { PartyDrawPage } from "@/features/owner/PartyDrawPage";
import { ParticipantPreferencesPage } from "@/features/participant/ParticipantPreferencesPage";
import { ParticipantReferencesPage } from "@/features/participant/ParticipantReferencesPage";
import { ParticipantRsvpPage } from "@/features/participant/ParticipantRsvpPage";
import { RevealPage } from "@/features/reveal/RevealPage";
import { NotFoundPage } from "./NotFoundPage";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/solicitar-acesso" element={<RequestOwnerAccessPage />} />

            <Route
              path="/admin"
              element={
                <AuthGuard requireRole="admin">
                  <AdminDashboardPage />
                </AuthGuard>
              }
            />

            <Route
              path="/owner"
              element={
                <AuthGuard requireRole="owner">
                  <OwnerDashboardPage />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/parties/new"
              element={
                <AuthGuard requireRole="owner">
                  <PartyCreatePage />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/parties/:partyId/edit"
              element={
                <AuthGuard requireRole="owner">
                  <PartyEditPage />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/parties/:partyId/participants"
              element={
                <AuthGuard requireRole="owner">
                  <PartyParticipantsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/parties/:partyId/exclusions"
              element={
                <AuthGuard requireRole="owner">
                  <PartyExclusionsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/parties/:partyId/draw"
              element={
                <AuthGuard requireRole="owner">
                  <PartyDrawPage />
                </AuthGuard>
              }
            />

            <Route
              path="/p/:partyId/preferences"
              element={
                <AuthGuard>
                  <ParticipantPreferencesPage />
                </AuthGuard>
              }
            />
            <Route
              path="/p/:partyId/references"
              element={
                <AuthGuard>
                  <ParticipantReferencesPage />
                </AuthGuard>
              }
            />
            <Route
              path="/p/:partyId/rsvp"
              element={
                <AuthGuard>
                  <ParticipantRsvpPage />
                </AuthGuard>
              }
            />

            <Route
              path="/reveal/:partyId/:participantId"
              element={
                <AuthGuard>
                  <RevealPage />
                </AuthGuard>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

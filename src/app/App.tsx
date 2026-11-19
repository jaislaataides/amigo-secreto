import type { ReactNode } from "react";
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
import { AppLayout } from "./AppLayout";
import { HomePage } from "./HomePage";
import { NotFoundPage } from "./NotFoundPage";

/** AuthGuard + cabeçalho de navegação, combinados — a maioria das rotas logadas usa os dois. */
function Protected(props: { requireRole?: "admin" | "owner"; children: ReactNode }) {
  return (
    <AuthGuard requireRole={props.requireRole}>
      <AppLayout>{props.children}</AppLayout>
    </AuthGuard>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/solicitar-acesso" element={<RequestOwnerAccessPage />} />

            <Route
              path="/home"
              element={
                <Protected>
                  <HomePage />
                </Protected>
              }
            />

            <Route
              path="/admin"
              element={
                <Protected requireRole="admin">
                  <AdminDashboardPage />
                </Protected>
              }
            />

            <Route
              path="/owner"
              element={
                // Aberta a todos: lista também os convites de quem só participa.
                <Protected>
                  <OwnerDashboardPage />
                </Protected>
              }
            />
            <Route
              path="/owner/parties/new"
              element={
                <Protected requireRole="owner">
                  <PartyCreatePage />
                </Protected>
              }
            />
            <Route
              path="/owner/parties/:partyId/edit"
              element={
                <Protected requireRole="owner">
                  <PartyEditPage />
                </Protected>
              }
            />
            <Route
              path="/owner/parties/:partyId/participants"
              element={
                <Protected requireRole="owner">
                  <PartyParticipantsPage />
                </Protected>
              }
            />
            <Route
              path="/owner/parties/:partyId/exclusions"
              element={
                <Protected requireRole="owner">
                  <PartyExclusionsPage />
                </Protected>
              }
            />
            <Route
              path="/owner/parties/:partyId/draw"
              element={
                <Protected requireRole="owner">
                  <PartyDrawPage />
                </Protected>
              }
            />

            <Route
              path="/p/:partyId/preferences"
              element={
                <Protected>
                  <ParticipantPreferencesPage />
                </Protected>
              }
            />
            <Route
              path="/p/:partyId/references"
              element={
                <Protected>
                  <ParticipantReferencesPage />
                </Protected>
              }
            />
            <Route
              path="/p/:partyId/rsvp"
              element={
                <Protected>
                  <ParticipantRsvpPage />
                </Protected>
              }
            />

            {/* Sem AppLayout de propósito: a revelação é uma tela de foco único,
                sem navegação de distração — a pessoa só quer ver quem tirou. */}
            <Route
              path="/reveal/:partyId/:participantId"
              // Sem AuthGuard: quem chega sem login entra ali mesmo, na tela da
              // revelação, e o papelzinho abre na sequência (mesma URL).
              element={<RevealPage />}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

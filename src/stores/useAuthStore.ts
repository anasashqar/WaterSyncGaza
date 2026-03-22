import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEMO_NGOS,
  DEMO_ADMIN_CREDENTIALS,
  DEMO_DRIVER,
} from "@/lib/demoAccounts";

// ============================================
// Role & Organization Types
// ============================================

/** System roles — matches Plan 3 personas */
export type UserRole = "admin" | "ngo" | "driver";

/** Simulated NGO organization */
interface NGOOrganization {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  logo: string; // emoji placeholder
}

/** User notification preferences */
interface UserPreferences {
  muteAll: boolean;
  receiveInApp: boolean;
  receivePush: boolean;
  receiveEmail: boolean;
}

// ============================================
// User & Auth State Models
// ============================================

export interface User {
  id: string;
  username: string;
  password?: string; // Simulated password (in real app, use hash)
  name: string;
  role: UserRole;
  institutionId: string | null;
}



// ============================================
// Auth Store
// ============================================

interface AuthState {
  // DB simulated tables for the Frontend (persisted)
  registeredUsers: User[];
  registeredNGOs: NGOOrganization[];

  // Current session
  user: User | null;
  isAuthenticated: boolean;

  // Computed role state
  role: UserRole;
  institutionId: string | null;
  ngoSetupComplete: boolean;
  contractManagerOpen: boolean;
  preselectedStationId: string | null;
  preferences: UserPreferences;

  // Actions
  login: (username: string, password?: string) => boolean;
  quickLogin: (role: UserRole, demoNgoId?: string) => boolean;
  logout: () => void;

  /** Register a new NGO User (Admin/Coordinator) */
  registerNGOUser: (
    ngoName: string,
    name: string,
    username: string,
    password?: string,
  ) => User | null;

  /** Register a new Driver linked to an existing NGO */
  registerDriver: (
    ngoId: string,
    name: string,
    username: string,
    password?: string,
  ) => User | null;

  // Setup workflows
  completeNGOSetup: () => void;
  openContractManager: (stationId?: string) => void;
  closeContractManager: () => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // Getters
  getCurrentNGO: () => NGOOrganization | null;
  isGodView: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // DB Tables
      registeredUsers: [
        {
          id: "admin-1",
          username: "WaterSync",
          password: "WS@2026",
          name: "مدير النظام الأساسي",
          role: "admin",
          institutionId: null,
        },
      ],
      registeredNGOs: [], // Clean start — no demo NGOs

      // Session
      user: null,
      isAuthenticated: false,
      role: "admin",
      institutionId: null,
      ngoSetupComplete: false,
      contractManagerOpen: false,
      preselectedStationId: null,
      preferences: {
        muteAll: false,
        receiveInApp: true,
        receivePush: true,
        receiveEmail: false,
      },

      login: (username, password) => {
        const { registeredUsers } = get();
        const userToLogin = registeredUsers.find(
          (u) =>
            u.username === username && u.password === (password || "password"),
        );

        if (userToLogin) {
          // Keep ngoSetupComplete persisted value — don't reset on every login
          set({
            user: userToLogin,
            isAuthenticated: true,
            role: userToLogin.role,
            institutionId: userToLogin.institutionId,
            contractManagerOpen: false,
            preselectedStationId: null,
          });
          return true;
        }
        return false;
      },

      quickLogin: (role, demoNgoId) => {
        const state = get();

        // Seed all demo data if not present yet (self-healing for persisted stores)
        const hasDemoData = state.registeredUsers.some(
          (u) => u.id === "demo-unrwa-user",
        );
        if (!hasDemoData) {
          const allDemoUsers = [
            ...DEMO_NGOS.map((n) => n.user),
            DEMO_DRIVER.user,
          ].filter(
            (du) =>
              !state.registeredUsers.some((u) => u.username === du.username),
          );
          const allDemoNGOs = DEMO_NGOS.map((n) => n.org).filter(
            (org) => !state.registeredNGOs.some((n) => n.id === org.id),
          );
          set({
            registeredUsers: [...state.registeredUsers, ...allDemoUsers],
            registeredNGOs: [...state.registeredNGOs, ...allDemoNGOs],
          });
        }

        // Determine credentials based on role
        let credentials: { username: string; password: string };
        if (role === "admin") {
          credentials = DEMO_ADMIN_CREDENTIALS;
        } else if (role === "ngo") {
          const ngo =
            DEMO_NGOS.find((n) => n.id === demoNgoId) || DEMO_NGOS[0];
          credentials = {
            username: ngo.user.username,
            password: ngo.user.password,
          };
        } else {
          credentials = {
            username: DEMO_DRIVER.user.username,
            password: DEMO_DRIVER.user.password,
          };
        }

        const success = get().login(credentials.username, credentials.password);
        if (success && role === "ngo") {
          set({ ngoSetupComplete: true });
        }
        return success;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          institutionId: null,
          role: "admin",
        });
      },

      registerNGOUser: (ngoNameAr, name, username, password) => {
        const { registeredUsers, registeredNGOs } = get();

        // Prevent duplicate usernames
        if (registeredUsers.some((u) => u.username === username)) return null;

        // Create new simulated NGO Org
        const newNgoId = `ngo-${Date.now()}`;
        const newNGO: NGOOrganization = {
          id: newNgoId,
          name: ngoNameAr, // simplified string use
          nameAr: ngoNameAr,
          color: `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`,
          logo: "🏢",
        };

        const newUser: User = {
          id: `usr-${Date.now()}`,
          username,
          password: password || "password",
          name,
          role: "ngo",
          institutionId: newNgoId,
        };

        set({
          registeredNGOs: [...registeredNGOs, newNGO],
          registeredUsers: [...registeredUsers, newUser],
        });
        return newUser;
      },

      registerDriver: (ngoId, name, username, password) => {
        const { registeredUsers } = get();
        if (registeredUsers.some((u) => u.username === username)) return null;

        const newUser: User = {
          id: `driver-${Date.now()}`,
          username,
          password: password || "password",
          name,
          role: "driver",
          institutionId: ngoId,
        };

        set({ registeredUsers: [...registeredUsers, newUser] });
        return newUser;
      },

      updatePreferences: (updates) =>
        set((state) => ({ preferences: { ...state.preferences, ...updates } })),

      completeNGOSetup: () =>
        set({ ngoSetupComplete: true, contractManagerOpen: false }),
      openContractManager: (stationId) =>
        set({ 
          contractManagerOpen: true, 
          preselectedStationId: stationId || null 
        }),
      closeContractManager: () => 
        set({ 
          contractManagerOpen: false, 
          preselectedStationId: null 
        }),

      getCurrentNGO: () => {
        const { institutionId, registeredNGOs } = get();
        if (!institutionId) return null;
        return registeredNGOs.find((n) => n.id === institutionId) ?? null;
      },

      isGodView: () => get().role === "admin",
    }),
    {
      name: "watersync-auth-storage",
      // Ensure we don't persist 'isAuthenticated' as true if we want them to login again on deep reloads,
      // but for "Offline" PWA apps, staying logged in is usually preferred.
      partialize: (state) => ({
        registeredUsers: state.registeredUsers,
        registeredNGOs: state.registeredNGOs,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        institutionId: state.institutionId,
        ngoSetupComplete: state.ngoSetupComplete,
      }),
      version: 2, // Increment to force reset old cached data
    },
  ),
);

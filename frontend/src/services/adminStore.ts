import { create } from "zustand";

export interface AdminStats {
  total_users: number;
  total_publishers: number;
  total_registered_content: number;
  total_manifests: number;
  total_chain_blocks: number;
  total_verifications: number;
  verifications_by_verdict: Record<string, number>;
  chain_integrity_valid: boolean;
}

export interface LedgerIntegrity {
  is_valid: boolean;
  total_blocks: number;
  genesis_hash: string;
  latest_hash: string;
  broken_index?: number | null;
  last_verified_at: string;
}

interface AdminStoreState {
  stats: AdminStats | null;
  integrity: LedgerIntegrity | null;
  usersList: any[];
  contentList: any[];
  auditLogsList: any[];
  setStats: (stats: AdminStats) => void;
  setIntegrity: (integrity: LedgerIntegrity) => void;
  setUsersList: (users: any[]) => void;
  setContentList: (content: any[]) => void;
  setAuditLogsList: (logs: any[]) => void;
  clearCache: () => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  stats: null,
  integrity: null,
  usersList: [],
  contentList: [],
  auditLogsList: [],
  setStats: (stats) => set({ stats }),
  setIntegrity: (integrity) => set({ integrity }),
  setUsersList: (usersList) => set({ usersList }),
  setContentList: (contentList) => set({ contentList }),
  setAuditLogsList: (auditLogsList) => set({ auditLogsList }),
  clearCache: () =>
    set({
      stats: null,
      integrity: null,
      usersList: [],
      contentList: [],
      auditLogsList: [],
    }),
}));

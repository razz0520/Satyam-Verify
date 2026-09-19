import { create } from "zustand";

interface PublisherState {
  // Overview cache
  overviewStats: any | null;
  ledgerIntegrity: any | null;
  recentPublications: any[];
  setOverviewData: (stats: any, integrity: any, recent: any[]) => void;

  // Publications cache
  publicationsList: any[];
  setPublicationsList: (items: any[]) => void;

  // Credentials cache
  credentialsList: any[];
  setCredentialsList: (items: any[]) => void;
}

export const usePublisherStore = create<PublisherState>((set) => ({
  overviewStats: null,
  ledgerIntegrity: null,
  recentPublications: [],
  setOverviewData: (stats, integrity, recent) =>
    set({
      overviewStats: stats,
      ledgerIntegrity: integrity,
      recentPublications: recent,
    }),

  publicationsList: [],
  setPublicationsList: (items) => set({ publicationsList: items }),

  credentialsList: [],
  setCredentialsList: (items) => set({ credentialsList: items }),
}));

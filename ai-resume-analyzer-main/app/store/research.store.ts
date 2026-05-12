import { create } from "zustand";

interface ResearchState {
  activeDocId: string | null;
  setActiveDocId: (docId: string | null) => void;
}

export const useResearchStore = create<ResearchState>((set) => ({
  activeDocId: null,
  setActiveDocId: (docId) => set({ activeDocId: docId }),
}));

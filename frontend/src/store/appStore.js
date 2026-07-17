import { create } from "zustand";

/** @typedef {'checking' | 'online' | 'offline'} BackendStatus */

/**
 * @typedef {Object} CurrentListing
 * @property {Record<string, unknown> | null} [final_listing]
 * @property {number | null} [risk_score]
 * @property {Array<Record<string, unknown>>} [issues_found]
 * @property {Record<string, unknown> | null} [pincode_risk]
 * @property {boolean} [category_mismatch_flagged]
 * @property {string | null} [mismatch_message]
 * @property {Array<Record<string, unknown>>} [agent_reasoning_trace]
 * @property {boolean} [fallback_used]
 * @property {string | null} [uploadedImageUrl]
 */

export const DEMO_LISTING_ID = "listing_kurti_01";
export const DEMO_SELLER_ID = "seller_demo_1";

export const useAppStore = create((set) => ({
  /** @type {BackendStatus} */
  backendStatus: "checking",
  setBackendStatus: (status) => set({ backendStatus: status }),

  /** @type {string} */
  selectedLanguage: "hi",
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

  /** @type {CurrentListing | null} */
  currentListing: null,
  setCurrentListing: (listing) => set({ currentListing: listing }),
  /** Optimistically remove a resolved issue and lower risk score locally */
  resolveIssue: (issueIndex) =>
    set((state) => {
      if (!state.currentListing?.issues_found) return state;
      const issues = [...state.currentListing.issues_found];
      const removed = issues.splice(issueIndex, 1)[0];
      const contribution = Number(removed?.contribution_pct) || 0;
      const currentScore = state.currentListing.risk_score ?? 0;
      return {
        currentListing: {
          ...state.currentListing,
          issues_found: issues,
          risk_score: Math.max(0, currentScore - contribution),
        },
      };
    }),

  /** @type {{ seller_id: string, name: string }} */
  sellerProfile: { seller_id: DEMO_SELLER_ID, name: "Priya" },
  setSellerProfile: (profile) => set({ sellerProfile: profile }),

  /** @type {Record<string, unknown> | null} */
  qnaData: null,
  setQnaData: (data) => set({ qnaData: data }),

  /** @type {Record<string, unknown> | null} */
  healthBrief: null,
  setHealthBrief: (brief) => set({ healthBrief: brief }),
}));

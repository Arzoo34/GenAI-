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

  /** @type {boolean} */
  simulationUnlocked: false,
  setSimulationUnlocked: (unlocked) => set({ simulationUnlocked: unlocked }),

  /** @type {Record<string, any> | null} */
  publishedListing: null,
  setPublishedListing: (listing) => set({ publishedListing: listing }),

  /** @type {Array<Record<string, any>>} */
  publishedListings: [
    {
      id: "listing_01",
      title: "Jaipuri Cotton Kurti",
      price: 599,
      category: "kurti",
      material: "Cotton",
      colour: "Blue",
      sleeve: "3/4 Sleeve",
      occasion: "Casual",
      available_sizes: ["S", "M", "L", "XL"],
      bullets: [
        "Pure high-quality soft cotton fabric",
        "Traditional hand-block print work",
        "Perfect for daily casual or office wear",
        "Comfortable fit with 3/4 sleeves",
        "Machine washable with color-fast guarantee"
      ],
      size_chart: {
        S: "Bust: 36 in, Length: 44 in",
        M: "Bust: 38 in, Length: 44 in",
        L: "Bust: 40 in, Length: 45 in",
        XL: "Bust: 42 in, Length: 45 in"
      },
      keywords: ["cotton kurti", "jaipuri print", "casual kurti", "women ethnic wear"]
    },
    {
      id: "listing_02",
      title: "Pink Banarasi Silk Saree",
      price: 2499,
      category: "saree",
      material: "Silk",
      colour: "Pink",
      sleeve: "Half Sleeve",
      occasion: "Festive",
      available_sizes: ["Free"],
      bullets: [
        "Premium Banarasi art silk fabric with gold zari border",
        "Vibrant pink body with intricate floral weave patterns",
        "Comes with an unstitched matching half-sleeve blouse piece",
        "Perfect dress code for weddings, festivals, and parties",
        "Dry clean only to maintain zari and weave shine"
      ],
      size_chart: {
        Free: "Length: 5.5 meters saree, 0.8 meters blouse piece"
      },
      keywords: ["pink saree", "banarasi silk", "zari border saree", "wedding wear saree"]
    }
  ],
  addPublishedListing: (listing) => set((state) => ({ publishedListings: [listing, ...state.publishedListings] })),
}));

import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

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
  // Authentication State
  user: null,
  session: null,
  authLoading: true,
  authError: null,

  setAuthError: (error) => set({ authError: error }),

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
  fetchPublishedListings: async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn("Could not fetch products from Supabase (make sure products table is created):", error.message);
        // Fallback to localStorage if table doesn't exist
        const local = localStorage.getItem("shuruaat_published_listings");
        if (local) {
          try {
            set({ publishedListings: JSON.parse(local) });
          } catch {}
        }
        return;
      }
      
      const mapped = data.map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        category: p.category,
        uploadedImageUrl: p.image_url || "",
        material: p.details?.material || "",
        colour: p.details?.colour || "",
        sleeve: p.details?.sleeve || "",
        occasion: p.details?.occasion || "",
        available_sizes: p.details?.available_sizes || [],
        description: p.details?.description || "",
        channels: p.details?.channels || [],
        risk_score: p.risk_score || 0,
        issues_found: p.issues_found || [],
      }));
      set({ publishedListings: mapped });
    } else {
      const local = localStorage.getItem("shuruaat_published_listings");
      if (local) {
        try {
          set({ publishedListings: JSON.parse(local) });
        } catch {}
      }
    }
  },

  addPublishedListing: async (listing) => {
    // 1. Update in-memory state
    set((state) => ({ publishedListings: [listing, ...state.publishedListings] }));
    
    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const session = (await supabase.auth.getSession()).data.session;
      const userId = session?.user?.id;
      if (userId) {
        const { error } = await supabase
          .from("products")
          .insert({
            seller_id: userId,
            title: listing.title,
            price: listing.price,
            category: listing.category,
            image_url: listing.uploadedImageUrl || listing.image_url || listing.image || "",
            details: {
              material: listing.material || "",
              colour: listing.colour || "",
              sleeve: listing.sleeve || "",
              occasion: listing.occasion || "",
              available_sizes: listing.available_sizes || [],
              description: listing.description || "",
              channels: listing.channels || [],
            },
            risk_score: listing.risk_score || 0,
            issues_found: listing.issues_found || [],
          });
          
        if (error) {
          console.warn("Failed to write listing to Supabase:", error.message);
        }
      }
    }
    
    // Keep local storage copy updated
    const currentListings = useAppStore.getState().publishedListings;
    localStorage.setItem("shuruaat_published_listings", JSON.stringify(currentListings));
  },

  // Auth actions
  initializeAuth: async (setLanguage, setBusinessName) => {
    set({ authLoading: true, authError: null });
    if (isSupabaseConfigured && supabase) {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        set({ authLoading: false, authError: error.message });
      } else {
        const user = session?.user || null;
        set({ session, user, authLoading: false });
        if (user) {
          // Fetch profile details from DB, create default if missing
          const { data: profileData } = await supabase
            .from("profiles")
            .select("business_name, selected_language")
            .eq("id", user.id)
            .single();
            
          if (profileData) {
            if (profileData.business_name) setBusinessName(profileData.business_name);
            if (profileData.selected_language) setLanguage(profileData.selected_language);
          } else {
            const metaName = user.user_metadata?.business_name || "Priya's Handloom Store";
            const metaLang = user.user_metadata?.selected_language || "hi";
            await supabase.from("profiles").upsert({
              id: user.id,
              business_name: metaName,
              selected_language: metaLang,
            });
            if (metaName) setBusinessName(metaName);
            if (metaLang) setLanguage(metaLang);
          }
          
          // Fetch listings
          useAppStore.getState().fetchPublishedListings();
        }
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          const user = session?.user || null;
          set({ session, user, authLoading: false });
          if (user) {
            supabase
              .from("profiles")
              .select("business_name, selected_language")
              .eq("id", user.id)
              .single()
              .then(({ data: profileData }) => {
                if (profileData) {
                  if (profileData.business_name) setBusinessName(profileData.business_name);
                  if (profileData.selected_language) setLanguage(profileData.selected_language);
                } else {
                  const metaName = user.user_metadata?.business_name || "Priya's Handloom Store";
                  const metaLang = user.user_metadata?.selected_language || "hi";
                  supabase.from("profiles").upsert({
                    id: user.id,
                    business_name: metaName,
                    selected_language: metaLang,
                  }).then(() => {
                    if (metaName) setBusinessName(metaName);
                    if (metaLang) setLanguage(metaLang);
                  });
                }
              });
            
            // Fetch listings
            useAppStore.getState().fetchPublishedListings();
          } else {
            // Cleared user
            setBusinessName("");
            set({ publishedListings: [] });
          }
        }
      );
      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode logic: load from local storage/state
      const savedUser = localStorage.getItem("shuruaat_demo_user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          set({ user, session: { user }, authLoading: false });
          const metaName = user.user_metadata?.business_name;
          const metaLang = user.user_metadata?.selected_language;
          if (metaName) setBusinessName(metaName);
          if (metaLang) setLanguage(metaLang);
          
          // Fetch listings
          useAppStore.getState().fetchPublishedListings();
        } catch {
          set({ authLoading: false });
        }
      } else {
        set({ authLoading: false });
      }
    }
  },

  login: async (email, password, setLanguage, setBusinessName) => {
    set({ authLoading: true, authError: null });
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ authError: error.message, authLoading: false });
        return false;
      }
      set({ session: data.session, user: data.user, authLoading: false });
      
      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("business_name, selected_language")
          .eq("id", data.user.id)
          .single();
          
        if (profileData) {
          if (profileData.business_name) setBusinessName(profileData.business_name);
          if (profileData.selected_language) setLanguage(profileData.selected_language);
        } else {
          const metaName = data.user.user_metadata?.business_name || "Priya's Handloom Store";
          const metaLang = data.user.user_metadata?.selected_language || "hi";
          await supabase.from("profiles").upsert({
            id: data.user.id,
            business_name: metaName,
            selected_language: metaLang,
          });
          if (metaName) setBusinessName(metaName);
          if (metaLang) setLanguage(metaLang);
        }
      }
      
      // Fetch listings
      useAppStore.getState().fetchPublishedListings();
      return true;
    } else {
      // Demo Mode login
      await new Promise(r => setTimeout(r, 1000)); // simulate network delay
      if (!email.includes("@")) {
        set({ authError: "Please enter a valid email address.", authLoading: false });
        return false;
      }
      if (password.length < 6) {
        set({ authError: "Password must be at least 6 characters.", authLoading: false });
        return false;
      }
      
      const mockUser = {
        id: "demo_user_id_" + Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: {
          business_name: localStorage.getItem("shuruaat_business_name") || "Priya's Handloom Store",
          selected_language: localStorage.getItem("shuruaat_language") || "hi",
        }
      };
      
      localStorage.setItem("shuruaat_demo_user", JSON.stringify(mockUser));
      set({ user: mockUser, session: { user: mockUser }, authLoading: false });
      
      const metaName = mockUser.user_metadata.business_name;
      const metaLang = mockUser.user_metadata.selected_language;
      if (metaName) setBusinessName(metaName);
      if (metaLang) setLanguage(metaLang);
      
      // Fetch listings
      useAppStore.getState().fetchPublishedListings();
      return true;
    }
  },

  signUp: async (email, password, businessName, language, setLanguage, setBusinessName) => {
    set({ authLoading: true, authError: null });
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
            selected_language: language,
          }
        }
      });
      if (error) {
        set({ authError: error.message, authLoading: false });
        return false;
      }
      
      set({ session: data.session, user: data.user, authLoading: false });
      
      if (data.user) {
        setBusinessName(businessName);
        setLanguage(language);
        
        // Explicitly create profile row to prevent foreign key errors
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            business_name: businessName,
            selected_language: language,
          });
          
        if (profileError) {
          console.warn("Failed to create profile row in public.profiles table:", profileError.message);
        }
        
        // Fetch listings
        useAppStore.getState().fetchPublishedListings();
      }
      return true;
    } else {
      // Demo Mode signup
      await new Promise(r => setTimeout(r, 1000));
      if (!email.includes("@")) {
        set({ authError: "Please enter a valid email address.", authLoading: false });
        return false;
      }
      if (password.length < 6) {
        set({ authError: "Password must be at least 6 characters.", authLoading: false });
        return false;
      }
      
      const mockUser = {
        id: "demo_user_id_" + Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: {
          business_name: businessName,
          selected_language: language,
        }
      };
      
      localStorage.setItem("shuruaat_demo_user", JSON.stringify(mockUser));
      set({ user: mockUser, session: { user: mockUser }, authLoading: false });
      setBusinessName(businessName);
      setLanguage(language);
      
      // Fetch listings
      useAppStore.getState().fetchPublishedListings();
      return true;
    }
  },

  logout: async (setBusinessName) => {
    set({ authLoading: true });
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("shuruaat_demo_user");
    }
    set({ session: null, user: null, publishedListings: [], authLoading: false });
    if (setBusinessName) setBusinessName("");
    localStorage.removeItem("shuruaat_business_name");
  },
}));

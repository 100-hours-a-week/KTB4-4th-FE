// 온보딩 단계와 입력 데이터의 상태 및 세션 저장 관리
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  isAllergyCode,
  isGiftExclusionCode,
  isInterestCategoryCode,
  MAX_INTEREST_SELECTIONS,
  type AllergyCode,
  type AvoidanceCode,
  type GiftExclusionCode,
  type InterestCategoryCode,
} from "@/lib/onboardingOptions";

export type ConsentId = "collection" | "purpose" | "visibility" | "retention" | "withdrawal";
export type Gender = "male" | "female";
export type OnboardingStep = 1 | 2 | 3 | 4;
export type AvoidanceCategory = "allergyCodes" | "giftExclusionCodes";

type OnboardingPhase = "privacy-consent" | "onboarding" | "review";

type OnboardingState = {
  phase: OnboardingPhase;
  currentStep: OnboardingStep;
  privacyConsents: Record<ConsentId, boolean>;
  formData: {
    gender: Gender | null;
    birthDateDigits: string;
    interestCategoryCodes: InterestCategoryCode[];
    allergyCodes: AllergyCode[];
    giftExclusionCodes: GiftExclusionCode[];
  };
};

type OnboardingAction =
  | { type: "HYDRATE"; state: OnboardingState }
  | { type: "COMPLETE_PRIVACY_CONSENT" }
  | { type: "GO_TO_STEP"; step: OnboardingStep }
  | { type: "GO_TO_REVIEW" }
  | { type: "SET_GENDER"; gender: Gender }
  | { type: "SET_BIRTH_DATE"; birthDateDigits: string }
  | { type: "TOGGLE_INTEREST"; interest: InterestCategoryCode }
  | { type: "TOGGLE_AVOIDANCE"; category: AvoidanceCategory; item: AvoidanceCode };

type OnboardingContextValue = {
  state: OnboardingState;
  isHydrated: boolean;
  completePrivacyConsent: () => void;
  goToStep: (step: OnboardingStep) => void;
  goToReview: () => void;
  setGender: (gender: Gender) => void;
  setBirthDate: (birthDateDigits: string) => void;
  toggleInterest: (interest: InterestCategoryCode) => void;
  toggleAvoidance: (category: AvoidanceCategory, item: AvoidanceCode) => void;
  clearSavedOnboarding: () => void;
};

const LEGACY_STORAGE_KEY = "needu:onboarding:v1";
const STORAGE_KEY_PREFIX = "needu:onboarding:v2";
const STORAGE_VERSION = 3;
const consentIds: ConsentId[] = ["collection", "purpose", "visibility", "retention", "withdrawal"];

const getStorageKey = (userId: number) => `${STORAGE_KEY_PREFIX}:${userId}`;

const initialState: OnboardingState = {
  phase: "privacy-consent",
  currentStep: 1,
  privacyConsents: {
    collection: false,
    purpose: false,
    visibility: false,
    retention: false,
    withdrawal: false,
  },
  formData: {
    gender: null,
    birthDateDigits: "",
    interestCategoryCodes: [],
    allergyCodes: [],
    giftExclusionCodes: [],
  },
};

const isUniqueCodeArray = <T extends string>(
  value: unknown,
  isCode: (item: string) => item is T,
): value is T[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "string" && isCode(item)) &&
  new Set(value).size === value.length;

const isStoredOnboardingState = (value: unknown): value is OnboardingState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<OnboardingState>;
  const consents = state.privacyConsents as Partial<Record<ConsentId, unknown>> | undefined;
  const formData = state.formData as Partial<OnboardingState["formData"]> | undefined;

  return (
    (state.phase === "privacy-consent" ||
      state.phase === "onboarding" ||
      state.phase === "review") &&
    (state.currentStep === 1 ||
      state.currentStep === 2 ||
      state.currentStep === 3 ||
      state.currentStep === 4) &&
    Boolean(consents) &&
    consentIds.every((id) => typeof consents?.[id] === "boolean") &&
    Boolean(formData) &&
    (formData?.gender === null || formData?.gender === "male" || formData?.gender === "female") &&
    typeof formData?.birthDateDigits === "string" &&
    /^\d{0,8}$/.test(formData.birthDateDigits) &&
    isUniqueCodeArray(formData?.interestCategoryCodes, isInterestCategoryCode) &&
    formData.interestCategoryCodes.length <= MAX_INTEREST_SELECTIONS &&
    isUniqueCodeArray(formData?.allergyCodes, isAllergyCode) &&
    isUniqueCodeArray(formData?.giftExclusionCodes, isGiftExclusionCode)
  );
};

const onboardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "COMPLETE_PRIVACY_CONSENT":
      return { ...state, phase: "onboarding", currentStep: 1 };
    case "GO_TO_STEP":
      return { ...state, phase: "onboarding", currentStep: action.step };
    case "GO_TO_REVIEW":
      return { ...state, phase: "review" };
    case "SET_GENDER":
      return { ...state, formData: { ...state.formData, gender: action.gender } };
    case "SET_BIRTH_DATE":
      return {
        ...state,
        formData: { ...state.formData, birthDateDigits: action.birthDateDigits },
      };
    case "TOGGLE_INTEREST": {
      const interestCategoryCodes = state.formData.interestCategoryCodes.includes(action.interest)
        ? state.formData.interestCategoryCodes.filter((interest) => interest !== action.interest)
        : state.formData.interestCategoryCodes.length < MAX_INTEREST_SELECTIONS
          ? [...state.formData.interestCategoryCodes, action.interest]
          : state.formData.interestCategoryCodes;

      return { ...state, formData: { ...state.formData, interestCategoryCodes } };
    }
    case "TOGGLE_AVOIDANCE": {
      const selectedItems = state.formData[action.category];
      const nextItems = (selectedItems as AvoidanceCode[]).includes(action.item)
        ? selectedItems.filter((item) => item !== action.item)
        : [...selectedItems, action.item];

      return {
        ...state,
        formData: { ...state.formData, [action.category]: nextItems },
      };
    }
    default:
      return state;
  }
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children, userId }: { children: ReactNode; userId: number }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const isPersistenceEnabledRef = useRef(true);
  const storageKey = getStorageKey(userId);

  useEffect(() => {
    try {
      window.sessionStorage.removeItem(LEGACY_STORAGE_KEY);

      const storedValue = window.sessionStorage.getItem(storageKey);

      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as {
          version?: unknown;
          userId?: unknown;
          state?: unknown;
        };

        if (
          parsedValue.version === STORAGE_VERSION &&
          parsedValue.userId === userId &&
          isStoredOnboardingState(parsedValue.state)
        ) {
          dispatch({ type: "HYDRATE", state: parsedValue.state });
        } else {
          window.sessionStorage.removeItem(storageKey);
        }
      }
    } catch {
      window.sessionStorage.removeItem(storageKey);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey, userId]);

  useEffect(() => {
    if (!isHydrated || !isPersistenceEnabledRef.current) {
      return;
    }

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ version: STORAGE_VERSION, userId, state }),
    );
  }, [isHydrated, state, storageKey, userId]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      isHydrated,
      completePrivacyConsent: () => dispatch({ type: "COMPLETE_PRIVACY_CONSENT" }),
      goToStep: (step) => dispatch({ type: "GO_TO_STEP", step }),
      goToReview: () => dispatch({ type: "GO_TO_REVIEW" }),
      setGender: (gender) => dispatch({ type: "SET_GENDER", gender }),
      setBirthDate: (birthDateDigits) => dispatch({ type: "SET_BIRTH_DATE", birthDateDigits }),
      toggleInterest: (interest) => dispatch({ type: "TOGGLE_INTEREST", interest }),
      toggleAvoidance: (category, item) => dispatch({ type: "TOGGLE_AVOIDANCE", category, item }),
      // 완료 후 메인 이동 전까지 현재 화면을 유지하도록 상태는 두고 저장값만 삭제
      clearSavedOnboarding: () => {
        isPersistenceEnabledRef.current = false;
        window.sessionStorage.removeItem(storageKey);
      },
    }),
    [isHydrated, state, storageKey],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding은 OnboardingProvider 내부에서 사용해야 합니다.");
  }

  return context;
};

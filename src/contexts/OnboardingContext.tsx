// 온보딩 단계와 입력 데이터의 상태 및 세션 저장 관리
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import type { OnboardingStatusStep } from "@/lib/api/onboardingStatus";
import {
  isAllergyCode,
  isGiftExclusionCode,
  isInterestCategoryCode,
  type AllergyCode,
  type AvoidanceCode,
  type GiftExclusionCode,
  type InterestCategoryCode,
} from "@/lib/onboardingOptions";

export type ConsentId = "collection" | "purpose" | "visibility" | "retention" | "withdrawal";
export type Gender = "male" | "female";
export type OnboardingStep = 1 | 2 | 3 | 4;
export type AvoidanceCategory = "allergyCodes" | "giftExclusionCodes";
export const MAX_INTEREST_SELECTIONS = 5;

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
  | { type: "TOGGLE_AVOIDANCE"; category: AvoidanceCategory; item: AvoidanceCode }
  | { type: "RESET" };

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
  resetOnboarding: () => void;
};

const STORAGE_KEY = "needu:onboarding:v1";
const STORAGE_VERSION = 2;
const consentIds: ConsentId[] = ["collection", "purpose", "visibility", "retention", "withdrawal"];

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

const agreedPrivacyConsents: Record<ConsentId, boolean> = {
  collection: true,
  purpose: true,
  visibility: true,
  retention: true,
  withdrawal: true,
};

const serverStepToOnboardingStep: Record<
  Exclude<OnboardingStatusStep, "CONSENTS">,
  OnboardingStep
> = {
  PROFILE: 1,
  INTERESTING: 3,
  UNWANTED: 4,
};

const createStateFromServerStep = (serverStep: OnboardingStatusStep): OnboardingState => {
  if (serverStep === "CONSENTS") {
    return initialState;
  }

  return {
    ...initialState,
    phase: "onboarding",
    currentStep: serverStepToOnboardingStep[serverStep],
    privacyConsents: agreedPrivacyConsents,
  };
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

const canRestoreStoredState = (storedState: OnboardingState, serverStep?: OnboardingStatusStep) => {
  if (!serverStep) {
    return true;
  }

  if (serverStep === "CONSENTS") {
    return storedState.phase === "privacy-consent";
  }

  if (serverStep === "PROFILE") {
    return storedState.phase !== "privacy-consent";
  }

  if (storedState.phase === "review") {
    return true;
  }

  if (storedState.phase !== "onboarding") {
    return false;
  }

  const minimumStep = serverStepToOnboardingStep[serverStep];
  return storedState.currentStep >= minimumStep;
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
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  serverStep,
}: {
  children: ReactNode;
  serverStep?: OnboardingStatusStep;
}) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as { version?: unknown; state?: unknown };

        if (
          parsedValue.version === STORAGE_VERSION &&
          isStoredOnboardingState(parsedValue.state) &&
          canRestoreStoredState(parsedValue.state, serverStep)
        ) {
          dispatch({ type: "HYDRATE", state: parsedValue.state });
        } else {
          window.sessionStorage.removeItem(STORAGE_KEY);

          if (serverStep) {
            dispatch({ type: "HYDRATE", state: createStateFromServerStep(serverStep) });
          }
        }
      } else if (serverStep) {
        dispatch({ type: "HYDRATE", state: createStateFromServerStep(serverStep) });
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);

      if (serverStep) {
        dispatch({ type: "HYDRATE", state: createStateFromServerStep(serverStep) });
      }
    } finally {
      setIsHydrated(true);
    }
  }, [serverStep]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, state }));
  }, [isHydrated, state]);

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
      resetOnboarding: () => {
        window.sessionStorage.removeItem(STORAGE_KEY);
        dispatch({ type: "RESET" });
      },
    }),
    [isHydrated, state],
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

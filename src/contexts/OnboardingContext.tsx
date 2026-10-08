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

export type ConsentId = "collection" | "purpose" | "visibility" | "retention" | "withdrawal";
export type Gender = "male" | "female";
export type OnboardingStep = 1 | 2 | 3 | 4;

type OnboardingPhase = "privacy-consent" | "onboarding";

type OnboardingState = {
  phase: OnboardingPhase;
  currentStep: OnboardingStep;
  privacyConsents: Record<ConsentId, boolean>;
  formData: {
    gender: Gender | null;
    birthDateDigits: string;
    // TODO: 세 번째와 네 번째 온보딩 단계 구현 시 각 단계의 입력 데이터 추가
  };
};

type OnboardingAction =
  | { type: "HYDRATE"; state: OnboardingState }
  | { type: "TOGGLE_PRIVACY_CONSENT"; id: ConsentId }
  | { type: "COMPLETE_PRIVACY_CONSENT" }
  | { type: "GO_TO_STEP"; step: OnboardingStep }
  | { type: "SET_GENDER"; gender: Gender }
  | { type: "SET_BIRTH_DATE"; birthDateDigits: string }
  | { type: "RESET" };

type OnboardingContextValue = {
  state: OnboardingState;
  isHydrated: boolean;
  togglePrivacyConsent: (id: ConsentId) => void;
  completePrivacyConsent: () => void;
  goToStep: (step: OnboardingStep) => void;
  setGender: (gender: Gender) => void;
  setBirthDate: (birthDateDigits: string) => void;
  resetOnboarding: () => void;
};

const STORAGE_KEY = "needu:onboarding:v1";
const STORAGE_VERSION = 1;
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
  },
};

const isStoredOnboardingState = (value: unknown): value is OnboardingState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<OnboardingState>;
  const consents = state.privacyConsents as Partial<Record<ConsentId, unknown>> | undefined;
  const formData = state.formData as Partial<OnboardingState["formData"]> | undefined;

  return (
    (state.phase === "privacy-consent" || state.phase === "onboarding") &&
    (state.currentStep === 1 ||
      state.currentStep === 2 ||
      state.currentStep === 3 ||
      state.currentStep === 4) &&
    Boolean(consents) &&
    consentIds.every((id) => typeof consents?.[id] === "boolean") &&
    Boolean(formData) &&
    (formData?.gender === null || formData?.gender === "male" || formData?.gender === "female") &&
    typeof formData?.birthDateDigits === "string" &&
    /^\d{0,8}$/.test(formData.birthDateDigits)
  );
};

const onboardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "TOGGLE_PRIVACY_CONSENT":
      return {
        ...state,
        privacyConsents: {
          ...state.privacyConsents,
          [action.id]: !state.privacyConsents[action.id],
        },
      };
    case "COMPLETE_PRIVACY_CONSENT":
      if (!Object.values(state.privacyConsents).every(Boolean)) {
        return state;
      }

      return { ...state, phase: "onboarding", currentStep: 1 };
    case "GO_TO_STEP":
      return { ...state, phase: "onboarding", currentStep: action.step };
    case "SET_GENDER":
      return { ...state, formData: { ...state.formData, gender: action.gender } };
    case "SET_BIRTH_DATE":
      return {
        ...state,
        formData: { ...state.formData, birthDateDigits: action.birthDateDigits },
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        const parsedValue = JSON.parse(storedValue) as { version?: unknown; state?: unknown };

        if (parsedValue.version === STORAGE_VERSION && isStoredOnboardingState(parsedValue.state)) {
          dispatch({ type: "HYDRATE", state: parsedValue.state });
        } else {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

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
      togglePrivacyConsent: (id) => dispatch({ type: "TOGGLE_PRIVACY_CONSENT", id }),
      completePrivacyConsent: () => dispatch({ type: "COMPLETE_PRIVACY_CONSENT" }),
      goToStep: (step) => dispatch({ type: "GO_TO_STEP", step }),
      setGender: (gender) => dispatch({ type: "SET_GENDER", gender }),
      setBirthDate: (birthDateDigits) => dispatch({ type: "SET_BIRTH_DATE", birthDateDigits }),
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

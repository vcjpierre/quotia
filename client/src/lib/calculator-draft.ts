import { SUPPORTED_CURRENCIES, type Task } from "@shared/schema";
import { type Currency } from "@/lib/currency";

// CalculatorState lives here so the draft module never has to import the hook
// (which imports this module). The hook re-exports the type for consumers.
export interface CalculatorState {
  hourlyRate: number;
  hoursPerDay: number;
  currency: Currency;
  tasks: Task[];
  freelancerInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  clientInfo: {
    name: string;
    email: string;
    address: string;
  };
  terms: string;
}

export type CalculatorDraft = CalculatorState;

const DRAFT_STORAGE_KEY = "quotia:calculator-draft:v1";
const DRAFT_VERSION = 1;

const TASK_TYPES: readonly Task["type"][] = ["project", "feature", "microtask"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  );
}

function isTaskType(value: unknown): value is Task["type"] {
  return (
    typeof value === "string" &&
    (TASK_TYPES as readonly string[]).includes(value)
  );
}

function parseTask(value: unknown): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.description !== "string" ||
    !isTaskType(value.type) ||
    !isFiniteNonNegative(value.hours) ||
    !isFiniteNonNegative(value.cost)
  ) {
    return null;
  }

  return {
    id: value.id,
    description: value.description,
    type: value.type,
    hours: value.hours,
    cost: value.cost,
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  } catch {
    // Accessing localStorage can throw when storage is disabled.
    return null;
  }
}

export function readDraft(): CalculatorDraft | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== DRAFT_VERSION) {
      return null;
    }

    const payload = parsed.state;
    if (!isRecord(payload)) {
      return null;
    }

    if (
      !isFiniteNonNegative(payload.hourlyRate) ||
      !isFiniteNonNegative(payload.hoursPerDay) ||
      !isCurrency(payload.currency) ||
      !Array.isArray(payload.tasks) ||
      !isRecord(payload.freelancerInfo) ||
      !isRecord(payload.clientInfo)
    ) {
      return null;
    }

    const tasks: Task[] = [];
    for (const entry of payload.tasks) {
      const task = parseTask(entry);
      if (task) {
        tasks.push(task);
      }
    }

    const freelancerInfo = payload.freelancerInfo;
    const clientInfo = payload.clientInfo;

    return {
      hourlyRate: payload.hourlyRate,
      hoursPerDay: payload.hoursPerDay,
      currency: payload.currency,
      tasks,
      freelancerInfo: {
        name: asString(freelancerInfo.name),
        title: asString(freelancerInfo.title),
        email: asString(freelancerInfo.email),
        phone: asString(freelancerInfo.phone),
      },
      clientInfo: {
        name: asString(clientInfo.name),
        email: asString(clientInfo.email),
        address: asString(clientInfo.address),
      },
      terms: asString(payload.terms),
    };
  } catch {
    return null;
  }
}

export function writeDraft(draft: CalculatorDraft): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: DRAFT_VERSION, state: draft }),
    );
  } catch {
    // Private mode and quota errors must never break the calculator.
  }
}

export function clearDraft(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage failures; there is nothing useful to do here.
  }
}

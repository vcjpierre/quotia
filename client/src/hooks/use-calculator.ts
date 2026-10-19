import { useState, useCallback, useMemo } from "react";
import { type Quote, type Task } from "@shared/schema";
import { type Currency } from "@/lib/currency";
import { nanoid } from "nanoid";

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

const defaultFreelancerInfo = {
  name: "Tu nombre",
  title: "Desarrollador Full-Stack",
  email: "tu.correo@ejemplo.com",
  phone: "+1 (555) 123-4567",
};

const defaultClientInfo = {
  name: "",
  email: "",
  address: "",
};

const defaultTerms = `• Se requiere un anticipo del 50% para comenzar el trabajo
• El saldo restante se abona al finalizar el proyecto
• Condiciones de pago: 30 días netos
• El presupuesto es válido por 30 días desde la fecha de emisión`;

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>({
    hourlyRate: 75,
    hoursPerDay: 8,
    currency: "USD",
    tasks: [],
    freelancerInfo: defaultFreelancerInfo,
    clientInfo: defaultClientInfo,
    terms: defaultTerms,
  });

  const addTask = useCallback((taskData: Omit<Task, "id" | "cost">) => {
    setState(prev => {
      const cost = taskData.hours * prev.hourlyRate;
      const newTask: Task = {
        ...taskData,
        id: nanoid(),
        cost,
      };
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, "id">>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, ...updates };
          if (updates.hours !== undefined) {
            updatedTask.cost = updatedTask.hours * prev.hourlyRate;
          }
          return updatedTask;
        }
        return task;
      }),
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
    }));
  }, []);

  const updateHourlyRate = useCallback((rate: number) => {
    setState(prev => ({
      ...prev,
      hourlyRate: rate,
      tasks: prev.tasks.map(task => ({
        ...task,
        cost: task.hours * rate,
      })),
    }));
  }, []);

  const updateHoursPerDay = useCallback((hours: number) => {
    setState(prev => ({
      ...prev,
      hoursPerDay: hours,
    }));
  }, []);

  const updateCurrency = useCallback((currency: Currency) => {
    setState(prev => ({
      ...prev,
      currency,
    }));
  }, []);

  const updateFreelancerInfo = useCallback((info: Partial<CalculatorState["freelancerInfo"]>) => {
    setState(prev => ({
      ...prev,
      freelancerInfo: { ...prev.freelancerInfo, ...info },
    }));
  }, []);

  const updateClientInfo = useCallback((info: Partial<CalculatorState["clientInfo"]>) => {
    setState(prev => ({
      ...prev,
      clientInfo: { ...prev.clientInfo, ...info },
    }));
  }, []);

  const updateTerms = useCallback((terms: string) => {
    setState(prev => ({
      ...prev,
      terms,
    }));
  }, []);

  const loadTemplate = useCallback((template: "website" | "mobile" | "consulting") => {
    const templates = {
      website: [
        { description: "Diseño y desarrollo de sitio web", type: "project" as const, hours: 80 },
        { description: "Sistema de gestión de contenidos", type: "feature" as const, hours: 20 },
        { description: "Optimización SEO", type: "feature" as const, hours: 10 },
        { description: "Pruebas y corrección de errores", type: "microtask" as const, hours: 8 },
      ],
      mobile: [
        { description: "Desarrollo de aplicación móvil", type: "project" as const, hours: 120 },
        { description: "Notificaciones push", type: "feature" as const, hours: 15 },
        { description: "Publicación en la tienda de aplicaciones", type: "microtask" as const, hours: 5 },
      ],
      consulting: [
        { description: "Consultoría técnica", type: "project" as const, hours: 40 },
        { description: "Revisión de código", type: "feature" as const, hours: 10 },
        { description: "Documentación", type: "microtask" as const, hours: 8 },
      ],
    };

    setState(prev => ({
      ...prev,
      tasks: templates[template].map(task => ({
        ...task,
        id: nanoid(),
        cost: task.hours * prev.hourlyRate,
      })),
    }));
  }, []);

  const loadQuote = useCallback((quote: Quote) => {
    setState({
      hourlyRate: quote.hourlyRate / 100,
      hoursPerDay: quote.hoursPerDay,
      currency: quote.currency as Currency,
      tasks: Array.isArray(quote.tasks) ? (quote.tasks as Task[]) : [],
      freelancerInfo: {
        name: quote.freelancerName,
        title: quote.freelancerTitle ?? "",
        email: quote.freelancerEmail ?? "",
        phone: quote.freelancerPhone ?? "",
      },
      clientInfo: {
        name: quote.clientName ?? "",
        email: quote.clientEmail ?? "",
        address: quote.clientAddress ?? "",
      },
      terms: quote.terms ?? defaultTerms,
    });
  }, []);

  const summary = useMemo(() => {
    const totalHours = state.tasks.reduce((sum, task) => sum + task.hours, 0);
    const totalDays = Math.round((totalHours / state.hoursPerDay) * 100) / 100;
    const subtotal = state.tasks.reduce((sum, task) => sum + task.cost, 0);
    const tax = 0; // Can be configurable
    const total = subtotal + tax;

    return {
      totalHours,
      totalDays,
      subtotal,
      tax,
      total,
      hourlyRate: state.hourlyRate,
    };
  }, [state.tasks, state.hoursPerDay, state.hourlyRate]);

  return {
    state,
    summary,
    addTask,
    updateTask,
    removeTask,
    updateHourlyRate,
    updateHoursPerDay,
    updateCurrency,
    updateFreelancerInfo,
    updateClientInfo,
    updateTerms,
    loadTemplate,
    loadQuote,
  };
}

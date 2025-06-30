import { useState, useCallback, useMemo } from "react";
import { type Task } from "@shared/schema";
import { nanoid } from "nanoid";

export interface CalculatorState {
  hourlyRate: number;
  hoursPerDay: number;
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
  name: "Your Name",
  title: "Full-Stack Developer",
  email: "your.email@example.com",
  phone: "+1 (555) 123-4567",
};

const defaultClientInfo = {
  name: "",
  email: "",
  address: "",
};

const defaultTerms = `• 50% deposit required to begin work
• Remaining balance due upon project completion
• Payment terms: Net 30 days
• Quote valid for 30 days from issue date`;

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>({
    hourlyRate: 75,
    hoursPerDay: 8,
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
        { description: "Website Design & Development", type: "project" as const, hours: 80 },
        { description: "Content Management System", type: "feature" as const, hours: 20 },
        { description: "SEO Optimization", type: "feature" as const, hours: 10 },
        { description: "Testing & Bug Fixes", type: "microtask" as const, hours: 8 },
      ],
      mobile: [
        { description: "Mobile App Development", type: "project" as const, hours: 120 },
        { description: "Push Notifications", type: "feature" as const, hours: 15 },
        { description: "App Store Submission", type: "microtask" as const, hours: 5 },
      ],
      consulting: [
        { description: "Technical Consultation", type: "project" as const, hours: 40 },
        { description: "Code Review", type: "feature" as const, hours: 10 },
        { description: "Documentation", type: "microtask" as const, hours: 8 },
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
    updateFreelancerInfo,
    updateClientInfo,
    updateTerms,
    loadTemplate,
  };
}

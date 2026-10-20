import { Plus, Trash2, ListChecks, Globe, Smartphone, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Task } from "@shared/schema";
import { formatCurrency, type Currency } from "@/lib/currency";

interface TaskManagementProps {
  tasks: Task[];
  currency: Currency;
  onAddTask: (task: Omit<Task, "id" | "cost">) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  onRemoveTask: (id: string) => void;
  onLoadTemplate: (template: "website" | "mobile" | "consulting") => void;
}

const templateButtonClass =
  "flex h-auto items-center justify-start gap-3 rounded-lg border-border bg-muted/40 p-4 text-left hover:bg-muted hover:text-foreground";

export function TaskManagement({
  tasks,
  currency,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onLoadTemplate,
}: TaskManagementProps) {
  const handleAddTask = () => {
    onAddTask({
      description: "Nueva tarea",
      type: "project",
      hours: 1,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListChecks className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>Tareas del proyecto</span>
            </CardTitle>

            <Button onClick={handleAddTask} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Agregar tarea</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-border bg-muted/40 p-4"
              >
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Descripción de la tarea
                    </Label>
                    <Input
                      value={task.description}
                      onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
                      className="mt-2 text-sm"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                    <Select
                      value={task.type}
                      onValueChange={(value: "project" | "feature" | "microtask") =>
                        onUpdateTask(task.id, { type: value })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Proyecto completo</SelectItem>
                        <SelectItem value="feature">Funcionalidad extra</SelectItem>
                        <SelectItem value="microtask">Microtarea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="lg:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Duración</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={task.hours}
                        onChange={(e) => onUpdateTask(task.id, { hours: Number(e.target.value) })}
                        className="text-sm"
                      />
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <Label className="text-xs font-medium text-muted-foreground">Costo</Label>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-semibold tabular text-foreground">
                        {formatCurrency(task.cost, currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Eliminar ${task.description}`}
                        onClick={() => onRemoveTask(task.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="py-10 text-center text-muted-foreground">
                <ListChecks className="mx-auto mb-4 h-10 w-10 opacity-40" aria-hidden="true" />
                <p className="text-sm">
                  Aún no hay tareas. Hacé clic en "Agregar tarea" para empezar.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cargá una plantilla con tareas típicas y ajustala a tu proyecto.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => onLoadTemplate("website")}
              className={templateButtonClass}
            >
              <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-medium">Proyecto web</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onLoadTemplate("mobile")}
              className={templateButtonClass}
            >
              <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-medium">App móvil</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onLoadTemplate("consulting")}
              className={templateButtonClass}
            >
              <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-medium">Consultoría</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

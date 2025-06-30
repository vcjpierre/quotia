import { Plus, Trash2, ListChecks, Globe, Smartphone, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Task } from "@shared/schema";

interface TaskManagementProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "cost">) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  onRemoveTask: (id: string) => void;
  onLoadTemplate: (template: "website" | "mobile" | "consulting") => void;
}

export function TaskManagement({
  tasks,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onLoadTemplate,
}: TaskManagementProps) {
  const handleAddTask = () => {
    onAddTask({
      description: "New Task",
      type: "project",
      hours: 1,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <div className="bg-accent/10 text-accent rounded-lg p-2">
                <ListChecks className="h-5 w-5" />
              </div>
              <span>Project Tasks</span>
            </CardTitle>
            
            <Button onClick={handleAddTask} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-4">
                    <Label className="text-sm font-medium">Task Description</Label>
                    <Input
                      value={task.description}
                      onChange={(e) => onUpdateTask(task.id, { description: e.target.value })}
                      className="mt-2 text-sm"
                    />
                  </div>
                  
                  <div className="lg:col-span-2">
                    <Label className="text-sm font-medium">Type</Label>
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
                        <SelectItem value="project">Full Project</SelectItem>
                        <SelectItem value="feature">Extra Feature</SelectItem>
                        <SelectItem value="microtask">Microtask</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <Label className="text-sm font-medium">Duration</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={task.hours}
                        onChange={(e) => onUpdateTask(task.id, { hours: Number(e.target.value) })}
                        className="text-sm"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">hrs</span>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-3">
                    <Label className="text-sm font-medium">Cost</Label>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(task.cost)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveTask(task.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks added yet. Click "Add Task" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => onLoadTemplate("website")}
              className="flex items-center space-x-3 p-4 h-auto bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <Globe className="h-5 w-5" />
              <span className="font-medium">Website Project</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onLoadTemplate("mobile")}
              className="flex items-center space-x-3 p-4 h-auto bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
            >
              <Smartphone className="h-5 w-5" />
              <span className="font-medium">Mobile App</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onLoadTemplate("consulting")}
              className="flex items-center space-x-3 p-4 h-auto bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <Lightbulb className="h-5 w-5" />
              <span className="font-medium">Consulting</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

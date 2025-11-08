import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  duration: number;
  predecessors: string[];
}

interface TaskInputProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  t0: number;
  onT0Change: (t0: number) => void;
}

export function TaskInput({ tasks, onTasksChange, t0, onT0Change }: TaskInputProps) {
  const [newTaskId, setNewTaskId] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [newTaskPredecessors, setNewTaskPredecessors] = useState('');

  const addTask = () => {
    if (!newTaskId.trim() || !newTaskDuration) {
      return;
    }

    const taskId = newTaskId.toUpperCase().trim();
    
    // Vérifier si l'ID existe déjà
    if (tasks.some(t => t.id === taskId)) {
      alert('Une tâche avec cet identifiant existe déjà');
      return;
    }

    const duration = parseInt(newTaskDuration);
    if (isNaN(duration) || duration <= 0) {
      alert('La durée doit être un nombre entier positif');
      return;
    }

    const predecessors = newTaskPredecessors
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(p => p.length > 0);

    // Vérifier que tous les antécédents existent
    const invalidPreds = predecessors.filter(p => !tasks.some(t => t.id === p));
    if (invalidPreds.length > 0) {
      alert(`Les antécédents suivants n'existent pas: ${invalidPreds.join(', ')}`);
      return;
    }

    const newTask: Task = {
      id: taskId,
      duration,
      predecessors
    };

    onTasksChange([...tasks, newTask]);
    setNewTaskId('');
    setNewTaskDuration('');
    setNewTaskPredecessors('');
  };

  const removeTask = (taskId: string) => {
    // Vérifier si d'autres tâches dépendent de celle-ci
    const dependentTasks = tasks.filter(t => t.predecessors.includes(taskId));
    if (dependentTasks.length > 0) {
      const confirm = window.confirm(
        `Les tâches suivantes dépendent de ${taskId}: ${dependentTasks.map(t => t.id).join(', ')}. Voulez-vous vraiment supprimer cette tâche?`
      );
      if (!confirm) return;
    }

    const updatedTasks = tasks
      .filter(t => t.id !== taskId)
      .map(t => ({
        ...t,
        predecessors: t.predecessors.filter(p => p !== taskId)
      }));
    
    onTasksChange(updatedTasks);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Tâches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* T0 Input */}
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
          <Label htmlFor="t0">T0 (Date de début):</Label>
          <Input
            id="t0"
            type="number"
            value={t0}
            onChange={(e) => onT0Change(parseInt(e.target.value) || 1)}
            className="w-24"
            min="1"
          />
        </div>

        {/* Existing Tasks */}
        <div className="space-y-2">
          <h3 className="font-medium">Tâches existantes ({tasks.length})</h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium">{task.id}</span>
                  <span className="text-gray-600 ml-2">Durée: {task.duration} jours</span>
                  {task.predecessors.length > 0 && (
                    <span className="text-gray-600 ml-2">
                      Antécédents: {task.predecessors.join(', ')}
                    </span>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune tâche. Ajoutez-en une ci-dessous.</p>
            )}
          </div>
        </div>

        {/* Add New Task */}
        <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
          <h3 className="font-medium">Ajouter une nouvelle tâche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="taskId">Identifiant</Label>
              <Input
                id="taskId"
                placeholder="Ex: A"
                value={newTaskId}
                onChange={(e) => setNewTaskId(e.target.value.toUpperCase())}
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="duration">Durée (jours)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Ex: 5"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="predecessors">Antécédents</Label>
              <Input
                id="predecessors"
                placeholder="Ex: A, B"
                value={newTaskPredecessors}
                onChange={(e) => setNewTaskPredecessors(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addTask} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter la tâche
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
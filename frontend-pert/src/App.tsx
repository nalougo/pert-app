import { useState } from "react";
import { TaskInput } from "./components/TaskInput";
import { PertDiagram } from "./components/PertDiagram";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { AlertCircle, CheckCircle2, Play, Loader2 } from "lucide-react";
import axios from "axios";

// URL de l'API Laravel
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface Task {
  id: string;
  duration: number;
  predecessors: string[];
}

interface CPMResult {
  tasks: Map<string, any>;
  projectDuration: number;
  criticalPath: string[];
  criticalEdges: Array<{ from: string; to: string }>;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [t0, setT0] = useState(1);
  const [result, setResult] = useState<CPMResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser l'affichage quand les tâches changent
  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks);
    setShowDiagram(false);
    setResult(null);
    setError(null);
  };

  const handleT0Change = (newT0: number) => {
    setT0(newT0);
    setShowDiagram(false);
    setResult(null);
    setError(null);
  };

  // Fonction pour générer le diagramme via l'API Laravel
  const handleGenerateDiagram = async () => {
    if (tasks.length === 0) {
      alert("Veuillez ajouter au moins une tâche avant de générer le diagramme");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Appel à l'API Laravel
      const response = await axios.post(`${API_URL}/pert/calculate`, {
        tasks,
        t0
      });

      // Convertir les données reçues en Map pour compatibilité
      const tasksMap = new Map();
      response.data.tasks.forEach((task: any) => {
        tasksMap.set(task.id, task);
      });

      const cpmResult: CPMResult = {
        tasks: tasksMap,
        projectDuration: response.data.projectDuration,
        criticalPath: response.data.criticalPath,
        criticalEdges: response.data.criticalEdges
      };

      setResult(cpmResult);
      setShowDiagram(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        "Erreur lors du calcul du diagramme PERT. Vérifiez que le backend Laravel est démarré."
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl text-blue-900">
            Générateur de Diagramme PERT
          </h1>
          <p className="text-lg text-gray-700">
            Méthode du Chemin Critique (CPM) - Planification de projet
          </p>
        </div>

        {/* Messages d'état */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {result && !error && showDiagram && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  Calcul réussi! {result.tasks.size} tâche(s) analysée(s). 
                  Durée totale: {result.projectDuration} jours.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau de gauche: Entrée des tâches */}
          <div className="lg:col-span-1">
            <TaskInput
              tasks={tasks}
              onTasksChange={handleTasksChange}
              t0={t0}
              onT0Change={handleT0Change}
            />
          </div>

          {/* Panneau de droite: Diagramme */}
          <div className="lg:col-span-2">
            {!showDiagram ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <p className="text-gray-600">
                      Ajoutez vos tâches puis cliquez sur le bouton ci-dessous 
                      pour générer le diagramme PERT
                    </p>
                    <Button 
                      onClick={handleGenerateDiagram}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading || tasks.length === 0}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Générer le diagramme PERT
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PertDiagram result={result} />
            )}
          </div>
        </div>

        {/* Bouton de génération centré (visible uniquement si pas encore généré) */}
        {!showDiagram && tasks.length > 0 && (
          <div className="flex justify-center">
            <Button 
              onClick={handleGenerateDiagram}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-2" />
                  Générer le diagramme PERT
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tableau récapitulatif - Affiché uniquement après génération */}
        {showDiagram && result && result.tasks.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">
                Tableau récapitulatif des calculs CPM
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-2">Tâche</th>
                      <th className="border border-gray-300 px-4 py-2">Durée</th>
                      <th className="border border-gray-300 px-4 py-2">Antécédents</th>
                      <th className="border border-gray-300 px-4 py-2">D+Tôt</th>
                      <th className="border border-gray-300 px-4 py-2">F+Tôt</th>
                      <th className="border border-gray-300 px-4 py-2">D+Tard</th>
                      <th className="border border-gray-300 px-4 py-2">F+Tard</th>
                      <th className="border border-gray-300 px-4 py-2">Marge Libre</th>
                      <th className="border border-gray-300 px-4 py-2">Marge Totale</th>
                      <th className="border border-gray-300 px-4 py-2">Critique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(result.tasks.values())
                      .sort((a, b) => a.id.localeCompare(b.id))
                      .map((task) => (
                        <tr
                          key={task.id}
                          className={
                            task.isCritical ? "bg-red-100" : "hover:bg-gray-50"
                          }
                        >
                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            {task.id}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.duration}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {task.predecessors.length > 0
                              ? task.predecessors.join(", ")
                              : "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.earliestStart}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.earliestFinish}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.latestStart}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.latestFinish}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.freeFloat}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.totalFloat}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {task.isCritical ? (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-red-600 text-white text-xs">
                                OUI
                              </span>
                            ) : (
                              <span className="text-gray-500">Non</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h3 className="font-semibold mb-2">Instructions d'utilisation</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
              <li>Définissez T0 (date de début du projet, par défaut = 1)</li>
              <li>
                Ajoutez vos tâches avec un identifiant (lettre majuscule), 
                une durée en jours, et leurs antécédents
              </li>
              <li>
                Les antécédents doivent être séparés par des virgules (ex: A, B)
              </li>
              <li>
                Cliquez sur "Générer le diagramme PERT" pour visualiser 
                le diagramme et le tableau récapitulatif
              </li>
              <li>Le diagramme PERT affiche le chemin critique en rouge</li>
              <li>
                Vous pouvez modifier vos tâches et régénérer le diagramme 
                à tout moment
              </li>
              <li>Téléchargez le diagramme en image PNG si nécessaire</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
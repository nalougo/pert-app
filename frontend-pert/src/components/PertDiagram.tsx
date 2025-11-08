import { useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download } from 'lucide-react';

interface CPMResult {
  tasks: Map<string, any>;
  projectDuration: number;
  criticalPath: string[];
  criticalEdges: Array<{ from: string; to: string }>;
}

interface PertDiagramProps {
  result: CPMResult | null;
}

export function PertDiagram({ result }: PertDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (!result || result.tasks.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagramme PERT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            Ajoutez des tâches pour générer le diagramme PERT
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer les positions des nœuds
  const nodeWidth = 180;
  const nodeHeight = 140;
  const horizontalSpacing = 100;
  const verticalSpacing = 80;

  // Organiser les tâches par niveau
  const levelMap = new Map<number, string[]>();
  result.tasks.forEach((task, id) => {
    const level = task.level || 0;
    if (!levelMap.has(level)) {
      levelMap.set(level, []);
    }
    levelMap.get(level)!.push(id);
  });

  // Calculer les positions
  const positions = new Map<string, { x: number; y: number }>();
  const maxLevel = Math.max(...Array.from(levelMap.keys()));
  
  levelMap.forEach((taskIds, level) => {
    const levelHeight = taskIds.length * (nodeHeight + verticalSpacing);
    taskIds.forEach((taskId, index) => {
      const x = level * (nodeWidth + horizontalSpacing) + 50;
      const y = index * (nodeHeight + verticalSpacing) + 50 - levelHeight / 2 + 200;
      positions.set(taskId, { x, y });
    });
  });

  const svgWidth = (maxLevel + 1) * (nodeWidth + horizontalSpacing) + 100;
  const svgHeight = Math.max(
    ...Array.from(positions.values()).map(p => p.y)
  ) + nodeHeight + 100;

  // Fonction pour télécharger le diagramme
  const downloadDiagram = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = svgWidth * 2;
    canvas.height = svgHeight * 2;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.download = 'diagramme-pert.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = url;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Diagramme PERT</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Durée totale du projet: <span className="font-semibold">{result.projectDuration} jours</span>
          </p>
          <p className="text-sm text-gray-600">
            Chemin critique: <span className="font-semibold text-red-600">
              {result.criticalPath.join(' → ')}
            </span>
          </p>
        </div>
        <Button onClick={downloadDiagram}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger PNG
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto border rounded-lg bg-gray-50">
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            className="bg-white"
          >
            {/* Définir les marqueurs pour les flèches */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#666" />
              </marker>
              <marker
                id="arrowhead-critical"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#dc2626" />
              </marker>
            </defs>

            {/* Dessiner les arêtes d'abord */}
            {Array.from(result.tasks.values()).map(task => (
              task.predecessors.map((predId: string) => {
                const fromPos = positions.get(predId);
                const toPos = positions.get(task.id);
                if (!fromPos || !toPos) return null;

                const isCritical = result.criticalEdges.some(
                  e => e.from === predId && e.to === task.id
                );

                // Points de départ et d'arrivée
                const x1 = fromPos.x + nodeWidth;
                const y1 = fromPos.y + nodeHeight / 2;
                const x2 = toPos.x;
                const y2 = toPos.y + nodeHeight / 2;

                return (
                  <line
                    key={`${predId}-${task.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isCritical ? '#dc2626' : '#666'}
                    strokeWidth={isCritical ? '3' : '2'}
                    markerEnd={isCritical ? 'url(#arrowhead-critical)' : 'url(#arrowhead)'}
                  />
                );
              })
            ))}

            {/* Dessiner les nœuds */}
            {Array.from(result.tasks.entries()).map(([taskId, task]) => {
              const pos = positions.get(taskId);
              if (!pos) return null;

              const isCritical = task.isCritical;

              return (
                <g key={taskId}>
                  {/* Rectangle principal */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={nodeWidth}
                    height={nodeHeight}
                    fill={isCritical ? '#fee2e2' : 'white'}
                    stroke={isCritical ? '#dc2626' : '#333'}
                    strokeWidth={isCritical ? '3' : '2'}
                    rx="4"
                  />

                  {/* Section 1: ID et Durée */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={nodeWidth}
                    height={30}
                    fill={isCritical ? '#dc2626' : '#3b82f6'}
                    rx="4"
                  />
                  <text
                    x={pos.x + nodeWidth / 2}
                    y={pos.y + 20}
                    textAnchor="middle"
                    fill="white"
                    className="font-semibold"
                  >
                    {taskId} ({task.duration}j)
                  </text>

                  {/* Lignes de séparation */}
                  <line x1={pos.x} y1={pos.y + 30} x2={pos.x + nodeWidth} y2={pos.y + 30} stroke="#333" strokeWidth="1" />
                  <line x1={pos.x} y1={pos.y + 65} x2={pos.x + nodeWidth} y2={pos.y + 65} stroke="#333" strokeWidth="1" />
                  <line x1={pos.x} y1={pos.y + 100} x2={pos.x + nodeWidth} y2={pos.y + 100} stroke="#333" strokeWidth="1" />
                  
                  {/* Ligne verticale au milieu */}
                  <line x1={pos.x + nodeWidth / 2} y1={pos.y + 30} x2={pos.x + nodeWidth / 2} y2={pos.y + nodeHeight} stroke="#333" strokeWidth="1" />

                  {/* Section 2: D+Tôt / F+Tôt */}
                  <text x={pos.x + 10} y={pos.y + 45} fontSize="11" className="font-medium">D+Tôt</text>
                  <text x={pos.x + nodeWidth / 2 + 10} y={pos.y + 45} fontSize="11" className="font-medium">F+Tôt</text>
                  <text x={pos.x + 10} y={pos.y + 58} fontSize="12" fill="#2563eb" className="font-semibold">
                    {task.earliestStart}
                  </text>
                  <text x={pos.x + nodeWidth / 2 + 10} y={pos.y + 58} fontSize="12" fill="#2563eb" className="font-semibold">
                    {task.earliestFinish}
                  </text>

                  {/* Section 3: D+Tard / F+Tard */}
                  <text x={pos.x + 10} y={pos.y + 80} fontSize="11" className="font-medium">D+Tard</text>
                  <text x={pos.x + nodeWidth / 2 + 10} y={pos.y + 80} fontSize="11" className="font-medium">F+Tard</text>
                  <text x={pos.x + 10} y={pos.y + 93} fontSize="12" fill="#dc2626" className="font-semibold">
                    {task.latestStart}
                  </text>
                  <text x={pos.x + nodeWidth / 2 + 10} y={pos.y + 93} fontSize="12" fill="#dc2626" className="font-semibold">
                    {task.latestFinish}
                  </text>

                  {/* Section 4: Marges */}
                  <text x={pos.x + 10} y={pos.y + 115} fontSize="11" className="font-medium">ML</text>
                  <text x={pos.x + nodeWidth / 2 + 10} y={pos.y + 115} fontSize="11" className="font-medium">MT</text>
                  <text x={pos.x + 10} y={pos.y + 128} fontSize="12" className="font-semibold">
                    {task.freeFloat}
                  </text>
                  <text x={pos.x + nodeWidth / 2 + 10} y={pos.y + 128} fontSize="12" className="font-semibold">
                    {task.totalFloat}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Légende */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
          <h4 className="font-medium">Légende</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">D+Tôt:</span> Date de début au plus tôt</div>
            <div><span className="font-medium">D+Tard:</span> Date de début au plus tard</div>
            <div><span className="font-medium">F+Tôt:</span> Date de fin au plus tôt</div>
            <div><span className="font-medium">F+Tard:</span> Date de fin au plus tard</div>
            <div><span className="font-medium">ML:</span> Marge libre</div>
            <div><span className="font-medium">MT:</span> Marge totale</div>
            <div className="col-span-2">
              <span className="inline-block w-4 h-4 bg-red-200 border-2 border-red-600 mr-2"></span>
              <span className="font-medium text-red-600">Tâches et arêtes critiques (MT = 0)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
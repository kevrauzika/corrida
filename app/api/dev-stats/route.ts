import { NextResponse } from 'next/server';

// ✅ NOVO: Interfaces para tipagem dos dados da API
interface WorkItemFromApi {
  id: number;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.State': string;
    'System.BoardColumn': string;
    'System.AssignedTo'?: { displayName: string };
    'Custom.Qualidade'?: { displayName: string };
    'Microsoft.VSTS.Common.Risk'?: string;
    'Microsoft.VSTS.Common.StateChangeDate'?: string;
  }
}

interface DetailedWorkItemForApi {
  id: number;
  title: string;
  dev: string;
  qa: string;
  complexity: string;
  resolvedDate: string;
}

async function getWorkItemIds() {
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const pat = process.env.AZURE_DEVOPS_PAT;

  if (!org || !project || !pat) {
    throw new Error("Variáveis de ambiente do Azure DevOps não configuradas.");
  }

  const query = {
    query: `
      SELECT [System.Id] 
      FROM WorkItems 
      WHERE 
        [System.WorkItemType] = 'User Story' 
        AND [Custom.Tipo] = 'Chamado' 
        AND [System.IterationPath] = 'TMB Educação\\Sprint Livre 01.07.25'
    `,
  };

  const url = `https://dev.azure.com/${org}/${project}/_apis/wit/wiql?api-version=7.1`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}` },
    body: JSON.stringify(query),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erro na query WIQL:", response.status, errorText);
    throw new Error(`Erro ao buscar IDs de work items: ${response.statusText}`);
  }

  const result = await response.json();
  return result.workItems ? result.workItems.map((item: { id: number }) => item.id) : [];
}
  
// ✅ ALTERAÇÃO: Adicionado tipo de retorno Promise<WorkItemFromApi[]>
async function getWorkItemDetails(ids: number[]): Promise<WorkItemFromApi[]> {
    const org = process.env.AZURE_DEVOPS_ORG;
    const pat = process.env.AZURE_DEVOPS_PAT;
    if (ids.length === 0) return [];

    const batchSize = 200;
    const workItemsDetails: WorkItemFromApi[] = [];
  
    const fields = [
      "System.Id",
      "System.Title",
      "System.State",
      "System.AssignedTo",
      "Custom.Qualidade",
      "Microsoft.VSTS.Common.Risk",
      "Microsoft.VSTS.Common.StateChangeDate",
      "System.BoardColumn"
    ];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const url = `https://dev.azure.com/${org}/_apis/wit/workitemsbatch?api-version=7.1`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}` },
        body: JSON.stringify({ ids: batchIds, fields }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro nos detalhes do Work Item:", response.status, errorText);
        throw new Error(`Erro ao buscar detalhes de work items: ${response.statusText}`);
      }
      // ✅ ALTERAÇÃO: Adicionado tipo para a resposta da API
      const result = await response.json() as { value: WorkItemFromApi[] };
      workItemsDetails.push(...result.value);
    }
    return workItemsDetails;
}

function getPointsFromRisk(risk: string | undefined): number {
  switch (risk) {
    case '1 - Baixo':
      return 5;
    case '2 - Médio':
      return 10;
    case '3 - Alta':
      return 15;
    default:
      return 0;
  }
}

// ✅ ALTERAÇÃO: Parâmetros e variáveis com tipos definidos
function processDataForDashboard(workItems: WorkItemFromApi[]) {
  const developerMap = new Map<string, { name: string; inDevelopment: number; completed: number; score: number; }>();
  const detailedWorkItems: DetailedWorkItemForApi[] = [];
  
  const dailyEvolutionMap = new Map<string, { [devName: string]: number }>();
  const allDevs = new Set<string>();

  const concludedColumns = new Set([
    'Code Review',
    'Wait Deploy',
    'Publicado',
    'Aguardando comunicação',
    'Finalizado'
  ]);

  workItems.forEach(item => {
    const fields = item.fields;
    const assignedTo = fields["System.AssignedTo"];
    const boardColumn = fields["System.BoardColumn"];
    const risk = fields["Microsoft.VSTS.Common.Risk"];

    if (assignedTo && assignedTo.displayName && boardColumn) {
      const devName = assignedTo.displayName;
      allDevs.add(devName); 

      if (!developerMap.has(devName)) {
        developerMap.set(devName, { name: devName, inDevelopment: 0, completed: 0, score: 0 });
      }
      
      const devData = developerMap.get(devName)!;

      if (concludedColumns.has(boardColumn)) {
        devData.completed++;
        devData.score += getPointsFromRisk(risk);
        
        const stateChangeDateStr = fields["Microsoft.VSTS.Common.StateChangeDate"];
        if (stateChangeDateStr) {
          const resolvedDate = new Date(stateChangeDateStr);
          const dateKey = resolvedDate.toISOString().split('T')[0];
          
          const dayData = dailyEvolutionMap.get(dateKey) || {};
          dayData[devName] = (dayData[devName] || 0) + 1;
          dailyEvolutionMap.set(dateKey, dayData);

          detailedWorkItems.push({
            id: item.id,
            title: fields["System.Title"] || "N/A",
            dev: devName,
            qa: fields["Custom.Qualidade"]?.displayName || "N/A",
            complexity: risk || "Não definida",
            resolvedDate: dateKey,
          });
        }
      } else if (boardColumn.toLowerCase().includes('desenvolvimento')) {
          devData.inDevelopment++;
      }
    }
  });

  const finalDevelopersData = Array.from(developerMap.values()).map(dev => ({
    name: dev.name,
    inDevelopment: dev.inDevelopment || 0,
    completed: dev.completed || 0,
    score: dev.score || 0,
  }));
  
  const sortedDates = Array.from(dailyEvolutionMap.keys()).sort();
  const evolutionData = sortedDates.map(date => {
      const dailyCounts = dailyEvolutionMap.get(date)!;
      const entry: { date: string; [key: string]: string | number } = { date };
      
      allDevs.forEach(dev => {
          entry[dev] = dailyCounts[dev] || 0;
      });

      return entry;
  });

  return {
    developers: finalDevelopersData,
    evolutionData: evolutionData,
    detailedWorkItems: detailedWorkItems.sort((a, b) => new Date(b.resolvedDate).getTime() - new Date(a.resolvedDate).getTime()),
  };
}

export async function GET() {
  console.log("\n--- [API] /api/dev-stats request received ---");
  try {
    console.log("[1] Fetching work item IDs...");
    const workItemIds = await getWorkItemIds();
    console.log(`[2] Found ${workItemIds.length} work item IDs.`);

    if (workItemIds.length === 0) {
        console.log("[2a] No items found for this sprint. Returning empty data.");
        return NextResponse.json({ developers: [], evolutionData: [], detailedWorkItems: [] });
    }

    console.log("[3] Fetching details for all items...");
    const workItemDetails = await getWorkItemDetails(workItemIds);
    console.log(`[4] Received details for ${workItemDetails.length} items.`);

    if (workItemDetails.length > 0) {
        console.log("[4a] Sample raw item from Azure DevOps:", JSON.stringify(workItemDetails[0], null, 2));
    }
    
    console.log("[5] Processing data for dashboard...");
    const dashboardData = processDataForDashboard(workItemDetails);
    
    console.log("[6] Data processing complete. Final data object before sending to frontend:");
    console.log(JSON.stringify(dashboardData, null, 2));

    console.log("[7] Sending successful response to frontend.");
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("[ERROR] Uncaught error in GET handler:", error);
    const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido no servidor.";
    
    return NextResponse.json({ message }, { status: 500 });
  }
}
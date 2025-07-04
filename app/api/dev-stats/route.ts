import { NextResponse } from 'next/server';

// As duas primeiras funções (getWorkItemIds, getWorkItemDetails) não mudam
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
  
async function getWorkItemDetails(ids: number[]) {
    const org = process.env.AZURE_DEVOPS_ORG;
    const pat = process.env.AZURE_DEVOPS_PAT;
    if (ids.length === 0) return [];

    const batchSize = 200;
    const workItemsDetails = [];
  
    const fields = [
      "System.Id",
      "System.Title",
      "System.State",
      "System.AssignedTo",
      "Custom.Qualidade",
      "Microsoft.VSTS.Common.Risk",
      "Microsoft.VSTS.Common.StateChangeDate"
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
      const result = await response.json();
      workItemsDetails.push(...result.value);
    }
    return workItemsDetails;
}

function processDataForDashboard(workItems: any[]) {
  const developerMap = new Map<string, { name: string; inDevelopment: number; qa: number; completed: number; }>();
  // Usaremos um Map para agrupar por hora
  const hourlyMap = new Map<string, { dateHour: string; total: number }>();
  const detailedWorkItems: any[] = [];

  workItems.forEach(item => {
    const fields = item.fields;
    const assignedTo = fields["System.AssignedTo"];
    const state = fields["System.State"];

    if (assignedTo && assignedTo.displayName && state) {
      const devName = assignedTo.displayName;

      if (!developerMap.has(devName)) {
        developerMap.set(devName, { name: devName, inDevelopment: 0, qa: 0, completed: 0 });
      }
      
      const devData = developerMap.get(devName)!;
      const stateLower = state.toLowerCase();

      switch (stateLower) {
        case 'em desenvolvimento':
        case 'code review':
          devData.inDevelopment++;
          break;
        case 'em teste':
          devData.qa++;
          break;
        case 'closed':
        case 'aguardando publicação':
        case 'aguardando release':
          devData.completed++;
          
          const stateChangeDateStr = fields["Microsoft.VSTS.Common.StateChangeDate"];
          if (stateChangeDateStr) {
            const resolvedDate = new Date(stateChangeDateStr);
            // ✅ AQUI ESTÁ A MUDANÇA: Criamos uma chave com Ano-Mês-DiaT Hora
            const dateHourKey = resolvedDate.toISOString().substring(0, 13); // Formato: YYYY-MM-DDTHH

            // Agrupamos a contagem por essa chave de hora
            const hourEntry = hourlyMap.get(dateHourKey) || { dateHour: dateHourKey, total: 0 };
            hourEntry.total++;
            hourlyMap.set(dateHourKey, hourEntry);

            // A lista detalhada continua igual
            detailedWorkItems.push({
              id: item.id,
              title: fields["System.Title"] || "N/A",
              dev: devName,
              qa: fields["Custom.Qualidade"]?.displayName || "N/A",
              complexity: fields["Microsoft.VSTS.Common.Risk"] || "Não definida",
              resolvedDate: resolvedDate.toISOString().split('T')[0],
            });
          }
          break;
      }
    }
  });

  const finalDevelopersData = Array.from(developerMap.values()).map(dev => ({
    name: dev.name,
    inDevelopment: dev.inDevelopment || 0,
    qa: dev.qa || 0,
    completed: dev.completed || 0,
  }));
  
  // Ordenamos os dados por hora antes de retornar
  const sortedHourlyData = Array.from(hourlyMap.values()).sort((a, b) => a.dateHour.localeCompare(b.dateHour));

  return {
    developers: finalDevelopersData,
    hourlyData: sortedHourlyData, // ✅ Renomeamos para 'hourlyData'
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
        return NextResponse.json({ developers: [], timelineData: [], detailedWorkItems: [] });
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
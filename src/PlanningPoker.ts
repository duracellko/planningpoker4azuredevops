import "es6-promise/auto";
import {
    CommonServiceIds,
    getClient,
    ILocationService,
    IVssRestClientOptions
} from "azure-devops-extension-api/Common";
import * as TfsCore from "azure-devops-extension-api/Core";
import { WorkRestClient } from "azure-devops-extension-api/Work"; 
import {
    FieldType,
    IWorkItemFormService,
    WorkItemTrackingServiceIds
} from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";

const baseUrl = "https://planningpoker.duracellko.net";
const windowName = "Duracellko.PlanningPoker";

interface ITfsContext {
    activityId: string,
    contextData: ITfsContextData
}

interface IWorkItemActionContext {
    workItemId: number,
    wokrItemTypeName: string,
    currentProjectGuid: string,
    currentProjectName: string,
    tfsContext: ITfsContext
}

interface ITfsContextData {
    collection: ITfsCollectionContext
}

interface ITfsCollectionContext {
    id: string,
    name: string
}

interface EstimationResultMessage {
    estimation: number,
    reference: string
}

async function planningPokerAction(context: IWorkItemActionContext) {
    const team = SDK.getTeamContext();
    const user = SDK.getUser();

    const azureDevOpsUrl = window.location.protocol + "//" + window.location.host + "/";
    const collection = context.tfsContext.contextData.collection;
    const reference = collection.name + "/" + context.currentProjectName + "/" + context.workItemId.toString();

    const uri = baseUrl + "/Index/" +
        encodeURIComponent(team.name) +
        "/" + encodeURIComponent(user.displayName) +
        "?CallbackUri=" + encodeURIComponent(azureDevOpsUrl) +
        "&CallbackReference=" + encodeURIComponent(reference) +
        "&AutoConnect=True";
    window.open(uri, windowName);
    return true;
}

async function onMessageReceived(event: MessageEvent<EstimationResultMessage>) {
    if (event.origin === baseUrl) {
        if (await checkCallbackReference(event.data.reference)) {
            const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
            const estimationField = await getEstimationField(workItemFormService);
            if (estimationField) {
                await workItemFormService.setFieldValue(estimationField, event.data.estimation);
            }

            window.focus();
        }
    }
}

async function checkCallbackReference(reference: string) {
    if (!!reference) {
        const referenceParts = reference.split("/");
        if (referenceParts.length == 3) {
            const referenceCollection = referenceParts[0];
            const referenceProject = referenceParts[1];
            const referenceWorkItemId = Number.parseInt(referenceParts[2]);

            const pageContext = SDK.getPageContext();
            const webContext = pageContext.webContext;
            const tfsContext = webContext as unknown as ITfsContextData;
            if (referenceProject === webContext.project.name &&
                referenceCollection === tfsContext.collection.name) {
                const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
                const workItemId = await workItemFormService.getId();
                return referenceWorkItemId === workItemId;
            }
        }
    }

    return false;
}

async function getEstimationField(workItemFormService: IWorkItemFormService) {
    const backlogEstimationField = await getBacklogEstimationField(workItemFormService);
    if (backlogEstimationField) {
        return backlogEstimationField;
    }

    return await getNumberEstimationField(workItemFormService);
}

async function getBacklogEstimationField(workItemFormService: IWorkItemFormService) {
    // Automatic resolving of root path does not work, so root path is resolved explicitly.
    const locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
    const rootPath = await locationService.getResourceAreaLocation(WorkRestClient.RESOURCE_AREA_ID);
    const clientOptions: IVssRestClientOptions = {
        rootPath: rootPath
    };
    const workRestClient = getClient(WorkRestClient, clientOptions);
    
    const webContext = SDK.getWebContext();
    const teamContext: TfsCore.TeamContext = {
        projectId: webContext.project.id,
        project: webContext.project.name,
        teamId: webContext.team.id,
        team: webContext.team.name
    };
    const backlogConfiguration = await workRestClient.getBacklogConfigurations(teamContext);

    const effortField = backlogConfiguration.backlogFields.typeFields["Effort"];
    if (effortField) {
        const fields = await workItemFormService.getFields();
        if (fields.some(f => f.referenceName === effortField)) {
            return effortField;
        }
    }

    return undefined;
}

async function getNumberEstimationField(workItemFormService: IWorkItemFormService) {
    const fields = await workItemFormService.getFields();
    const field = fields.find(f => f.type === FieldType.Double && !f.readOnly);
    return field?.referenceName;
}

async function initialize() {
    await SDK.init();

    SDK.register(
        SDK.getContributionId(),
        {
            execute: (context: IWorkItemActionContext) => planningPokerAction(context)
        }
    );

    window.addEventListener("message", onMessageReceived);
}

initialize();

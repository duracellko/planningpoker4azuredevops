import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import {
    IWorkItemFormService,
    WorkItemTrackingServiceIds
} from "azure-devops-extension-api/WorkItemTracking";

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
            const estimation = event.data.estimation;
            
            await workItemFormService.setFieldValue("Microsoft.VSTS.Scheduling.StoryPoints", estimation);

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
            if (referenceProject === webContext.project.name) {
                const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
                const workItemId = await workItemFormService.getId();
                return referenceWorkItemId === workItemId;
            }
        }
    }

    return false;
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

import "es6-promise/auto";
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

async function initialize() {
    await SDK.init();

    SDK.register(
        SDK.getContributionId(),
        {
            execute: (context: IWorkItemActionContext) => planningPokerAction(context)
        }
    );    
}

initialize();

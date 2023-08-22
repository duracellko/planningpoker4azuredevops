# Planning Poker for Azure DevOps

This is Azure DevOps extension that enables to open [Planning Poker application](https://planningpoker.duracellko.net/) from a work item window. This way it is possible to simply start the Planning Poker estimation directly from a work item.

## How to do estimation

1. Open a work item that you would like to estimate.
2. Select **Planning Poker** from the work item menu. The Planning Poker application is opened.
3. Confirm that you want to open a new team in the Planning Poker application. The team name and user name is taken over from Azure DevOps.
4. Let other team members to join the Planning Poker team. It is possible to either share the URL or people can open it from Azure DevOps.
4. Start Planning Poker estimation.
5. Let all members to submit their estimations.
6. Select to show estimation summary. Then it is possible to submit an aggregated value to Azure DevOps work item.

## Planning Poker application

Planning Poker 4 Azure is independent application and more information can be found at [Planning Poker 4 Azure repository](https://github.com/duracellko/planningpoker4azure).

# Build

## Requirements

- Node.js 18.17 LTS or higher version

# How to build

There are following `npm run` scripts in this project:

- **build** - compiles TypeScript files to JavaScript bundle.
- **package** - builds the extension VSIX file. The file is Azure DevOps extension installation package. This command can be executed only after `build` command.
- **publish** - publishes the extension to configured Azure DevOps organization.
- **clean** - deletes all build artifacts.

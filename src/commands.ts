import * as Docker from 'dockerode';
import { basename } from 'path';
import * as vscode from 'vscode';
import { dockerClient } from './docker-client';
import { dockerExec } from './docker-exec';
import { logging } from './utils/logging';

export async function addDockerFolder(): Promise<void> {
    let containers;
    try {
        containers = await dockerClient.listInfo();
    } catch (err) {
        logging.error(err.message);
        vscode.window.showErrorMessage('Unable to connect to Docker.');
        return;
    }
    if (containers.length === 0) {
        vscode.window.showInformationMessage('There are no running Docker containers.');
        return;
    }
    const container = await pickContainer(containers);
    if (!container) {
        return;
    }
    const folderName = await inputPath();
    if (!folderName) {
        return;
    }
    let absPath;
    try {
        absPath = await getAbsolutePath(container.Id, folderName);
        if (!(await isDirectory(container.Id, absPath))) {
            vscode.window.showErrorMessage(`${folderName} is not a directory.`);
            return;
        }
    } catch (err) {
        vscode.window.showErrorMessage(`${folderName} does not exist.`);
        return;
    }

    const start = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length || 0;
    const uri = vscode.Uri.parse(`docker://${container.Id}${absPath}`);

    vscode.workspace.updateWorkspaceFolders(start, 0, {
        uri,
        name: `${basename(folderName)} | ${container.Image} (${container.Names[0].substr(1)})`
    });
}

async function getAbsolutePath(containerId: string, folderName: string): Promise<string> {
    return await dockerExec.readlink(containerId, folderName);
}

async function isDirectory(containerId: string, folderName: string): Promise<boolean> {
    const fileStat = await dockerExec.stat(containerId, folderName);
    return fileStat.isDirectory();
}

async function pickContainer(containers: Docker.ContainerInfo[]): Promise<Docker.ContainerInfo | undefined> {
    const containerName = await vscode.window.showQuickPick(containers.map(
        container => `${container.Image}(${container.Names[0]}:${container.Id.substr(0, 8)})`
    ));
    if (!containerName) {
        return;
    }
    const [, id] = <string[]>containerName.match(/:([0-9a-f]{8})\)$/);
    return containers.find(container => container.Id.startsWith(id));
}

async function inputPath(): Promise<string | undefined> {
    return await vscode.window.showInputBox({ prompt: 'Directory Path', value: '.' });
}

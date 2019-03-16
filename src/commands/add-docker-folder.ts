import { basename } from 'path';
import * as vscode from 'vscode';
import { Container } from '../docker/container';
import { Containers } from '../docker/containers';
import { fileCommands } from '../file-commands';
import { logging } from '../utils/logging';

export async function addDockerFolder(): Promise<void> {
    let containers: Container[];
    try {
        containers = await Containers.listAll();
    } catch (err) {
        logging.error(err.message);
        vscode.window.showErrorMessage('Unable to connect to Docker.');
        return;
    }
    if (containers.length === 0) {
        vscode.window.showInformationMessage('There are no running Docker containers.');
        return;
    }
    const container = await Containers.selectContainer(containers);
    if (!container) {
        return;
    }
    const folderName = await inputPath();
    if (!folderName) {
        return;
    }
    let absPath;
    try {
        absPath = await getAbsolutePath(container.id, folderName);
        if (!(await isDirectory(container.id, absPath))) {
            vscode.window.showErrorMessage(`${folderName} is not a directory.`);
            return;
        }
    } catch (err) {
        vscode.window.showErrorMessage(`${folderName} does not exist.`);
        return;
    }

    const start = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length || 0;
    const uri = vscode.Uri.parse(`docker://${container.id}${absPath}`);

    vscode.workspace.updateWorkspaceFolders(start, 0, {
        uri,
        name: `${basename(folderName)} | ${container.image} (${container.name.substr(1)})`
    });
}

async function getAbsolutePath(containerId: string, folderName: string): Promise<string> {
    return await fileCommands.readlink(containerId, folderName);
}

async function isDirectory(containerId: string, folderName: string): Promise<boolean> {
    const fileStat = await fileCommands.stat(containerId, folderName);
    return fileStat.isDirectory();
}

async function inputPath(): Promise<string | undefined> {
    return await vscode.window.showInputBox({ prompt: 'Directory Path', value: '.' });
}

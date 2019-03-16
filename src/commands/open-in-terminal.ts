import * as path from 'path';
import * as vscode from 'vscode';
import { getConfig } from '../config';
import { Container } from '../docker/container';
import { Containers } from '../docker/containers';
import { fileCommands } from '../file-commands';

export async function openInTerminal(resource: vscode.Uri | undefined) {
    let container: Container | undefined;
    if (resource) {
        container = await Containers.find(resource.authority);
    } else {
        container = await detectActiveContainerId();
        if (container === undefined) {
            return;
        }
    }
    const terminalOptions = initTerminalOpions(container.image);
    const workdir = resource ? await parentDirIfFile(resource) : null;
    const execCommand = getConfig().execCommand;

    const terminal = vscode.window.createTerminal(terminalOptions);
    terminal.sendText(`docker exec -it ${workdir ? `-w ${workdir} ` : ''}${container.id} ${execCommand}`);
    terminal.show();
}

async function detectActiveContainerId(): Promise<Container | undefined> {
    const containers = Containers.listInWorkspace();
    if (containers.length === 0) {
        vscode.window.showInformationMessage(`No docker containers opened`);
        return;
    }
    return await Containers.selectContainer(containers);
}

function initTerminalOpions(imageName: string | undefined): vscode.TerminalOptions {
    const terminalOptions: vscode.TerminalOptions = {};
    terminalOptions.name = `Shell: ${imageName || ''}`;
    return terminalOptions;
}

async function parentDirIfFile(resource: vscode.Uri): Promise<string> {
    const stat = await fileCommands.stat(resource.authority, resource.fsPath);
    return stat.isDirectory() ? resource.fsPath : path.dirname(resource.fsPath);
}

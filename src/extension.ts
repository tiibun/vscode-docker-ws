import * as vscode from 'vscode';
import { addDockerFolder } from './commands';
import { dockerClient } from './docker-client';
import { DockerFileSystemProvider } from './docker-file-system-provider';
import { Level, logging } from './utils/logging';
import * as Docker from 'dockerode';

export function activate(context: vscode.ExtensionContext) {
    logging.init('Docker Workspace', Level.INFO);

    dockerClient.init(getConfiguration());

    let dockerws = new DockerFileSystemProvider();

    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('docker', dockerws, { isCaseSensitive: true }),

        vscode.commands.registerCommand('dockerws:addDockerFolder', addDockerFolder),
    );
}

function getConfiguration(): Docker.DockerOptions | undefined {
    // Use 1) dockerWS.host 2) docker.host
    const value: string = vscode.workspace.getConfiguration('dockerWS').get('host') ||
        vscode.workspace.getConfiguration('docker').get('host', '');
    const errorMessage = 'The docker.host configuration setting must be entered as <host>:<port>, e.g. dockerhost:2375';
    if (value) {
        let newHost: string = '';
        let newPort: number = 2375;
        let sep: number = -1;

        sep = value.lastIndexOf(':');

        if (sep < 0) {
            vscode.window.showErrorMessage(errorMessage);
        } else {
            newHost = value.slice(0, sep);
            newPort = Number(value.slice(sep + 1));
            if (isNaN(newPort)) {
                vscode.window.showErrorMessage(errorMessage);
            } else {
                return { host: newHost, port: newPort };
            }
        }
    }
    return;
}
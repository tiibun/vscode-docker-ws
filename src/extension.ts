import * as vscode from 'vscode';
import { addDockerFolder } from './commands';
import { dockerClient } from './docker-client';
import { DockerFileSystemProvider } from './docker-file-system-provider';
import { Level, logging } from './utils/logging';

export function activate(context: vscode.ExtensionContext) {
    logging.init('Docker Workspace', Level.INFO);

    // TODO: docker setting
    dockerClient.init();

    let dockerws = new DockerFileSystemProvider();

    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('docker', dockerws, { isCaseSensitive: true }),

        vscode.commands.registerCommand('dockerws:addDockerFolder', addDockerFolder),
    );
}

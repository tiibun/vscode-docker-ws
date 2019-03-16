import * as vscode from 'vscode';
import { addDockerFolder } from './commands/add-docker-folder';
import { openInTerminal } from './commands/open-in-terminal';
import { getConfig } from './config';
import { dockerClient } from './docker-client';
import { DockerFileSystemProvider } from './docker-file-system-provider';
import { Level, logging } from './utils/logging';

export function activate(context: vscode.ExtensionContext) {
    logging.init('Docker Workspace', Level.INFO);

    dockerClient.init(getConfig().host);

    let dockerws = new DockerFileSystemProvider();

    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('docker', dockerws, { isCaseSensitive: true }),

        vscode.commands.registerCommand('dockerws:addDockerFolder', addDockerFolder),
        vscode.commands.registerCommand('dockerws:openInTerminal', openInTerminal),
    );
}

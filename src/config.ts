import * as Docker from 'dockerode';
import * as vscode from 'vscode';

export class Config {
    constructor(public host: Docker.DockerOptions | undefined, public execCommand: string | undefined) {
    }
}

export function getConfig(): Config {
    const host = getHost();
    const execCommand = getExecCommand();
    return new Config(host, execCommand);
}

function getHost(): Docker.DockerOptions | undefined {
    // Use 1) dockerWS.host 2) docker.host
    const value: string =
        vscode.workspace.getConfiguration('dockerWS').get('host') ||
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

function getExecCommand(): string | undefined {
    return vscode.workspace.getConfiguration('dockerWS').get('attachShellCommand.linuxContainer') ||
        vscode.workspace.getConfiguration('docker').get('attachShellCommand.linuxContainer');
}

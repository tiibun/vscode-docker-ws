import * as vscode from 'vscode';
import { dockerClient } from '../docker-client';
import { DockerNotFoundError } from '../exceptions';
import { Container, DefaultContainer } from './container';

export class Containers {
    private static workspaceContainers = new Map<string, Container>();

    public static async listAll(): Promise<Container[]> {
        const containerInfos = await dockerClient.listInfo();
        return containerInfos.map(info => new DefaultContainer(info.Id, info.Names[0], info.Image));
    }

    public static listInWorkspace(): Container[] {
        const containers: Container[] = [];
        this.workspaceContainers.forEach(cont => 
            containers.push(cont));
        return containers;
    }

    public static async find(containerId: string): Promise<Container> {
        const container = this.workspaceContainers.get(containerId) || 
            (await this.listAll()).find(cont => cont.id === containerId);
        if (container === undefined) {
            throw new DockerNotFoundError(`Not found container id ${containerId}`);
        }
        return container;
    }

    public static async addWorkspaceContainer(containerId: string): Promise<void>;
    public static async addWorkspaceContainer(container: Container): Promise<void>;
    public static async addWorkspaceContainer(container: string | Container): Promise<void> {
        if (typeof container === 'string') {
            const found = (await this.listAll()).find(cont => cont.id === container);
            if (found === undefined) {
                throw new DockerNotFoundError(`Not found container ${container}`);
            }
            container = found;
        }
        this.workspaceContainers.set(container.id, container);
    }

    public static async selectContainer(containers: Container[]): Promise<Container | undefined> {
        const containerName = await vscode.window.showQuickPick(containers.map(
            container => `${container.image}(${container.name}:${container.id.substr(0, 8)})`
        ));
        if (!containerName) {
            return;
        }
        const [, id] = <string[]>containerName.match(/:([0-9a-f]{8})\)$/);
        return containers.find(container => container.id.startsWith(id));
    }
}

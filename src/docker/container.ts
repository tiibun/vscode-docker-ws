import { dockerClient } from '../docker-client';

export interface Container {
    id: string;
    name: string;
    image: string;

    exec: (...args: string[]) => Promise<Buffer>;
}

export class DefaultContainer implements Container {
    private containerExecutor: dockerClient.Executor;

    constructor(public id: string, public name: string, public image: string) {
        this.containerExecutor = new dockerClient.Executor(id);
    }

    public exec(...args: string[]): Promise<Buffer> {
        return this.containerExecutor.exec(...args);
    }
}

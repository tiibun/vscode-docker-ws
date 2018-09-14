import * as Docker from 'dockerode';
import { DockerConnectionError } from './exceptions';
import { IncomingMessage } from 'http';
import { WritableStreamBuffer } from 'stream-buffers';
import { logging } from './utils/logging';

export namespace dockerClient {
    export let docker: Docker;

    /**
     * Initialize dockerode instance.
     *
     * @param options Docker.DockerOptions
     */
    export function init(options?: Docker.DockerOptions) {
        docker = new Docker(options);
    }

    /**
     * List docker containers.
     *
     * @throws [`DockerConnectionError`](./exceptions/DockerConnectionError)
     */
    export async function listInfo(): Promise<Docker.ContainerInfo[]> {
        try {
            return await docker.listContainers();
        } catch (err) {
            throw new DockerConnectionError(`Docker connection failed - \n${err.json.message}`);
        }
    }

    export class Container {
        public constructor(private containerId: string) { }

        private container: Docker.Container = docker.getContainer(this.containerId);

        /**
         *
         * @param commands command and arguments
         * @throws [`DockerConnectionError`](./exceptions/DockerConnectionError)
         */
        public async exec(...commands: string[]): Promise<Buffer> {
            logging.debug(() => `execute on ${this.containerId.substr(0, 8)} command: ${commands.map(
                c => c.length > 30 ? c.substr(0, 27).concat('...') : c
            ).join(' ')}`);

            let exec: Docker.Exec;
            try {
                exec = await this.container.exec({
                    Cmd: commands,
                    AttachStdout: true,
                    AttachStderr: true,
                });
            } catch (err) {
                throw new DockerConnectionError(`Docker connection failed - \n${err.json.message}`);
            }
            const stream: Docker.Exec & { output: IncomingMessage } = await exec.start({});
            const stdoutBuffer = new WritableStreamBuffer();
            const stderrBuffer = new WritableStreamBuffer();

            docker.modem.demuxStream(stream.output, stdoutBuffer, stderrBuffer);

            return new Promise<Buffer>((resolve, reject) => {
                stream.output.on('end', () => {
                    if (stderrBuffer.size() > 0) {
                        const stderr = stderrBuffer.getContentsAsString();
                        logging.debug(stderr);
                        return reject(stderr);
                    } else if (stdoutBuffer.size() > 0) {
                        return resolve(stdoutBuffer.getContents());
                    }
                    resolve(Buffer.alloc(0));
                }).on('error', (err: Error) => {
                    reject(err);
                });
            });
        }
    }
}

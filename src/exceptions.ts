export class DockerConnectionError extends Error {
    public constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, DockerConnectionError.prototype);
    }
}

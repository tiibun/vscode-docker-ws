export class DockerConnectionError extends Error {
    public constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, DockerConnectionError.prototype);
    }
}

export class DockerNotFoundError extends Error {
    public constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, DockerConnectionError.prototype);
    }
}

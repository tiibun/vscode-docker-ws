import * as path from 'path';
import * as vscode from 'vscode';
import { dockerExec } from './docker-exec';
import { DockerConnectionError } from './exceptions';
import { FileStat } from './utils/filetype';
import { logging } from './utils/logging';

export class DockerFileSystemProvider implements vscode.FileSystemProvider {
    /**
     * @inheritdoc
     */
    public async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        logging.debug(`stat ${uri.path}`);
        return await this.statOrThrow(uri);
    }

    /**
     * @inheritdoc
     */
    public async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        logging.debug(`readDirectory ${uri.path}`);
        await this.statOrThrow(uri);
        return await dockerExec.ls(uri.authority, uri.path);
    }

    /**
    * @inheritdoc
    */
    public async createDirectory(uri: vscode.Uri): Promise<void> {
        logging.debug(`createDirectory ${uri.path}`);

        if (await this.exists(uri)) {
            throw vscode.FileSystemError.FileExists(`${uri.path} exists.`);
        }

        let parent = uri.with({ path: path.dirname(uri.path) });
        const { fileNotFound, fileStat } = await this.statOrFileNotFound(parent);
        if (fileStat) {
            if (!fileStat.isWritable()) {
                throw vscode.FileSystemError.NoPermissions(`${uri.path} is not writable.`);
            }
        } else {
            throw fileNotFound;
        }

        await dockerExec.mkdir(uri.authority, uri.path);

        this.eventEmitter.fire([
            { type: vscode.FileChangeType.Changed, uri: parent },
            { type: vscode.FileChangeType.Created, uri }
        ]);
    }

    /**
     * @inheritdoc
     */
    public async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        logging.debug(`readFile ${uri.path}`);

        await this.statOrThrow(uri);
        return await dockerExec.cat(uri.authority, uri.path);
    }

    /**
     * @inheritdoc
     */
    public async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        logging.debug(`writeFile ${uri.path}`);

        const { fileNotFound, fileStat } = await this.statOrFileNotFound(uri);
        if (fileStat) {
            if (options.overwrite) {
                if (!fileStat.isWritable()) {
                    throw vscode.FileSystemError.NoPermissions(`${uri.path} is not writable.`);
                }
            } else {
                throw vscode.FileSystemError.FileExists(`${uri.path} exists.`);
            }
        } else {
            if (!options.create) {
                throw fileNotFound;
            }
        }

        let parent = uri.with({ path: path.dirname(uri.path) });
        const { fileNotFound: parentFileNotFound, fileStat: parentFileStat } = await this.statOrFileNotFound(parent);
        if (parentFileStat) {
            if (!parentFileStat.isWritable()) {
                throw vscode.FileSystemError.NoPermissions(`${parent.path} is not writable.`);
            }
        } else {
            if (options.create) {
                throw parentFileNotFound;
            }
        }

        await dockerExec.echo(uri.authority, uri.path, content);

        if (options.create) {
            this.eventEmitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
        }
        this.eventEmitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    }

    /**
     * @inheritdoc
     */
    public async delete(uri: vscode.Uri, options: { recursive: boolean; }): Promise<void> {
        logging.debug(`delete ${uri.path}`);
        await this.statOrThrow(uri);
        await dockerExec.rm(uri.authority, uri.path, options);

        let parent = uri.with({ path: path.dirname(uri.path) });
        this.eventEmitter.fire([
            { type: vscode.FileChangeType.Changed, uri: parent },
            { type: vscode.FileChangeType.Deleted, uri }
        ]);
    }

    /**
     * @inheritdoc
     */
    public async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        logging.debug(`rename ${oldUri.path} to ${newUri.path}`);
        await this.statOrThrow(oldUri);

        let newParent = newUri.with({ path: path.dirname(newUri.path) });
        await this.statOrThrow(newParent);

        const { fileStat: newFileExists } = await this.statOrFileNotFound(newUri);
        if (newFileExists) {
            if (!options.overwrite) {
                throw vscode.FileSystemError.FileExists(`${newUri.path} exists.`);
            }
        }

        await dockerExec.mv(oldUri.authority, oldUri.path, newUri.path, options);

        this.eventEmitter.fire([
            { type: vscode.FileChangeType.Deleted, uri: oldUri },
            { type: vscode.FileChangeType.Created, uri: newUri }]
        );
    }

    /**
     * @inheritdoc
     */
    public async copy(source: vscode.Uri, destination: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        logging.debug(`copy ${source.path} to ${destination.path}`);
        await this.statOrThrow(source);

        let newParent = destination.with({ path: path.dirname(destination.path) });
        await this.statOrThrow(newParent);

        const { fileStat: destinationExists } = await this.statOrFileNotFound(destination);
        if (destinationExists) {
            if (!options.overwrite) {
                throw vscode.FileSystemError.FileExists(`${destination.path} exists.`);
            }
        }

        await dockerExec.cp(source.authority, source.path, destination.path, options);

        this.eventEmitter.fire([
            { type: vscode.FileChangeType.Deleted, uri: source },
            { type: vscode.FileChangeType.Created, uri: destination }]
        );
    }

    private eventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

    /**
     * @inheritdoc
     */
    public readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this.eventEmitter.event;

    /**
     * @inheritdoc
     */
    public watch(_uri: vscode.Uri, _options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        // ignore changed events
        return new vscode.Disposable(() => { });
    }

    private async exists(uri: vscode.Uri): Promise<boolean> {
        const { fileStat } = await this.statOrFileNotFound(uri);
        return (fileStat !== undefined);
    }

    private async statOrThrow(uri: vscode.Uri): Promise<FileStat> {
        const { fileNotFound, fileStat } = await this.statOrFileNotFound(uri);
        if (fileStat) {
            return fileStat;
        }
        throw fileNotFound;
    }

    private async statOrFileNotFound(uri: vscode.Uri): Promise<{ fileNotFound?: vscode.FileSystemError, fileStat?: FileStat }> {
        try {
            return { fileStat: await dockerExec.stat(uri.authority, uri.path) };
        } catch (err) {
            if (err instanceof DockerConnectionError) {
                throw err;
            }
            return { fileNotFound: vscode.FileSystemError.FileNotFound(`${uri.path} does not exist.`) };
        }
    }
}

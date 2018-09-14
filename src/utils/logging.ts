import * as vscode from 'vscode';

export enum Level {
    DEBUG = 0,
    INFO = 10,
    ERROR = 100
}

export namespace logging {
    let outputChannel: vscode.OutputChannel;
    let _level: Level;

    export function init(name: string, level: Level) {
        outputChannel = vscode.window.createOutputChannel(name);
        _level = level;
    }

    export function debug(message: any) {
        if (_level > Level.DEBUG) { return; }
        write('[DEBUG]', message);
        return message;
    }

    export function info(message: any) {
        if (_level > Level.INFO) { return; }
        write('[INFO]', message);
        return message;
    }

    export function error(message: any, err?: Error) {
        if (_level > Level.ERROR) { return; }
        write('[ERROR]', message);
        if (err) {
            write(err.message);
            if (err.stack) {
                write(err.stack);
            }
        }
    }

    function write(...messages: any[]) {
        const allMessage: string[] = [];
        for (let message of messages) {
            if (message instanceof Function) {
                message = message.call();
            }
            allMessage.push(message.toString());
        }
        outputChannel.appendLine(allMessage.join(' '));
    }
}

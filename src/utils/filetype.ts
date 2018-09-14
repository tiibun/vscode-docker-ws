import * as vscode from 'vscode';
import * as fs from 'fs';

export const hasType = (target: vscode.FileType, fileType: vscode.FileType) => (target & fileType) === fileType;

const hasMode = (target: number, mode: number) => (target & mode) === mode;

export function detectFileType(mode: number): vscode.FileType {
    if (hasMode(mode, fs.constants.S_IFLNK)) {
        return vscode.FileType.SymbolicLink;
    } else if (hasMode(mode, fs.constants.S_IFREG)) {
        return vscode.FileType.File;
    } else if (hasMode(mode, fs.constants.S_IFDIR)) {
        return vscode.FileType.Directory;
    } else {
        return vscode.FileType.Unknown;
    }
}

export class FileStat implements vscode.FileStat {
    constructor(
        public name: string,
        public mode: number,
        public type: vscode.FileType,
        public size: number,
        public ctime: number,
        public mtime: number) { }

    isDirectory = () => hasType(this.type, vscode.FileType.Directory);

    isWritable = () => hasMode(this.mode, fs.constants.S_IWUSR);
}

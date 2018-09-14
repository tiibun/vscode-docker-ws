import * as assert from 'assert';
import * as vscode from 'vscode';
import { detectFileType, hasType, FileStat } from '../../utils/filetype';

suite('detectFileType', function () {
    test('returns symbolic link', function () {
        assert.equal(detectFileType(0o0122755), vscode.FileType.SymbolicLink);
    });
    test('returns regular file', function () {
        assert.equal(detectFileType(0o0100644), vscode.FileType.File);
    });
    test('returns directory', function () {
        assert.equal(detectFileType(0o040755), vscode.FileType.Directory);
    });
});

suite('hasType', function () {
    test('returns symbolic link', function () {
        assert.equal(hasType(vscode.FileType.SymbolicLink | vscode.FileType.File, vscode.FileType.SymbolicLink), true);
        assert.equal(hasType(vscode.FileType.SymbolicLink | vscode.FileType.Directory, vscode.FileType.SymbolicLink), true);
    });
    test('returns regular file', function () {
        assert.equal(hasType(vscode.FileType.File, vscode.FileType.File), true);
        assert.equal(hasType(vscode.FileType.SymbolicLink | vscode.FileType.File, vscode.FileType.File), true);
    });
    test('returns directory', function () {
        assert.equal(hasType(vscode.FileType.Directory, vscode.FileType.Directory), true);
        assert.equal(hasType(vscode.FileType.SymbolicLink | vscode.FileType.Directory, vscode.FileType.Directory), true);
    });
});

suite('isWritable', function () {
    test('return writable', function () {
        const testee = new FileStat('', 0o0100600, vscode.FileType.File, 0, 0, 0);
        assert.equal(testee.isWritable(), true);
        testee.mode = 0o0100400;
        assert.equal(testee.isWritable(), false);
    });
});

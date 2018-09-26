'use strict';
import * as vscode from 'vscode';

const COMMAND_NAME = 'runSpecInTerminal';
const UNSAVED_FILE_PATH = 'Untitled-1';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    `extension.${COMMAND_NAME}`,
    () => {
      const editor = vscode.window.activeTextEditor as vscode.TextEditor;

      if (!editor) {
        return vscode.window.showErrorMessage(
          'Error: No active file! Please pick file with .spec extension'
        );
      }

      if (editor.document.uri.path === UNSAVED_FILE_PATH) {
        return vscode.window.showErrorMessage(
          'Error: Unsaved file! Please save file with .spec extension'
        );
      }

      if (!editor.document.fileName.match(/.spec$/)) {
        return vscode.window.showErrorMessage(
          'Error: File has incorrect extension! Please pick file with .spec extension'
        );
      }

      const terminal = vscode.window.createTerminal(editor.document.fileName);
      terminal.sendText(`npm test -- ${editor.document.uri.path}`);
      terminal.show();
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

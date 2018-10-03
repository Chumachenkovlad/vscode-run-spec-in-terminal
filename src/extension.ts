import { exec } from 'child_process';
import * as vscode from 'vscode';

'use strict';
const COMMAND_NAME = 'runSpecInTerminal';
const UNSAVED_FILE_PATH = 'Untitled-1';
const FILE_EXTENSION = '.spec.ts';

interface TerminalWithProcessId {
  processId: number;
  terminal: vscode.Terminal;
}

interface TerminalProcess {
  id: string;
  code: string;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    `extension.${COMMAND_NAME}`,
    async () => {
      const editor = vscode.window.activeTextEditor as vscode.TextEditor;

      if (!editor) {
        return vscode.window.showErrorMessage(
          `Error: No active file! Please pick file with ${FILE_EXTENSION} extension`
        );
      }

      if (editor.document.uri.path === UNSAVED_FILE_PATH) {
        return vscode.window.showErrorMessage(
          `Error: Unsaved file! Please save file with ${FILE_EXTENSION} extension`
        );
      }

      if (!editor.document.fileName.match(new RegExp(`${FILE_EXTENSION}$`))) {
        return vscode.window.showErrorMessage(
          `Error: File has incorrect extension! Please pick file with ${FILE_EXTENSION} extension`
        );
      }

      const terminalsWithIds = await Promise.all(
        vscode.window.terminals.map(async terminal => {
          const processId = await terminal.processId;
          return { processId, terminal } as TerminalWithProcessId;
        })
      );

      const execById = (terminalWithId: TerminalWithProcessId) =>
        new Promise((resolve, reject) => {
          exec(`ps`, (err, stdout) => {
            if (err) {
              reject(err);
            }

            const processes = stdout
              .split('\n')
              .slice(1)
              .map(line => line.split(' '))
              .filter(line => line.length > 3)
              .map(line => {
                const [id, code] = line;
                return { id, code } as TerminalProcess;
              });

            const terminalProcess = processes.find(
              item => item.id === terminalWithId.processId.toString()
            ) as TerminalProcess;

            const currentTermilProcesses = processes.filter(
              process => process.code === terminalProcess.code
            );

            resolve(
              currentTermilProcesses.length === 1 ? terminalWithId : undefined
            );
          });
        });

      const freeTerminalsWithIds = (await Promise.all(
        terminalsWithIds.map(execById)
      )).filter(Boolean) as TerminalWithProcessId[];

      const terminal =
        (freeTerminalsWithIds.length && freeTerminalsWithIds[0].terminal) ||
        vscode.window.createTerminal(editor.document.fileName);
      terminal.sendText(`npm test -- ${editor.document.uri.path}`);
      terminal.show();
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

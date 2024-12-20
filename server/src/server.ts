import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  InsertTextFormat,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import * as fs from 'fs';
import path from 'path';

// Load the JSON file containing your predefined completions
const completionsFilePath = path.resolve(__dirname, '../src/completions.json');
let predefinedCompletions: { [key1: string]: { [key2: string]: string[] } };

try {
  const data = fs.readFileSync(completionsFilePath, 'utf8');
  predefinedCompletions = JSON.parse(data);
} catch (error) {
  console.error('Failed to load completions.json', error);
  predefinedCompletions = {};
}

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [" ", "\n", "\t"],
      },
    },
  };

  return result;
});

// documents.onDidChangeContent((change) => {
//   connection.window.showInformationMessage(
//     "STUFF CHANGED!: " + change.document.uri
//   );
// });

connection.onCompletion((params: CompletionParams) => {
  const document = documents.get(params.textDocument.uri);

  if (document) {
    const position = params.position;
    const textBeforeCursor = document.getText({
      start: { line: position.line, character: 0 },
      end: { line: position.line, character: position.character },
    });
    const textChunkBeforeCursor = document.getText({
      start: { line: 0, character: 0 },
      end: { line: position.line, character: position.character },
    });

    // Generate completion items (example: simple keyword completions)
    const suggestions: CompletionItem[] = [];

    // Suggest keyword1
    if (textBeforeCursor.slice(-2) === "= ") {
      for (let keyword1 in predefinedCompletions) {
        suggestions.push({
          label: keyword1,
          kind: CompletionItemKind.Class,
          insertText: `${keyword1} `,
        })
      }
    }

    // Suggest keyword2
    const regex = /=\s*([a-zA-Z0-9_]+)\s+(?!\w+)/;
    const match = regex.exec(textBeforeCursor);
    if (match?.[1]) {
      const keyword1 = match[1]

      if (keyword1 && predefinedCompletions[keyword1]) {
        for (const keyword2 in predefinedCompletions[keyword1]) {
          suggestions.push({
            label: keyword2,
            kind: CompletionItemKind.Class,
            insertText: `${keyword2} `
          });
        }
      }
    }

    // Suggest keys
    const keys_regex = /=\s*([a-zA-Z0-9_]+)\s+(\w+)\s*\{\s*(?:[\w-]+:\s*(?:[\w-]+|".*?")\s*)*$/;
    const keys_match = keys_regex.exec(textChunkBeforeCursor);

    if (keys_match?.[1] && keys_match?.[2]) {
      const keyword1 = keys_match[1]
      const keyword2 = keys_match[2]

      // Find the block of curly braces surrounding the cursor
      const textBeforeCursor = document.getText({ start: { line: 0, character: 0 }, end: position });
      const textAfterCursor = document.getText({ start: position, end: { line: document.lineCount, character: 0 } });

      const startBraceIndex = textBeforeCursor.lastIndexOf("{");
      const endBraceIndex = textAfterCursor.indexOf("}");

      let currentBlock = "";
      if (startBraceIndex !== -1 && endBraceIndex !== -1) {
        currentBlock = textBeforeCursor.slice(startBraceIndex) + textAfterCursor.slice(0, endBraceIndex + 1);
      }

      const existing_keys: string[] = [];
      if (currentBlock) {
        // Find keys within the current block
        const keyRegex = /\b(\w+)\b\s*:/g;
        let keyMatch;
        while ((keyMatch = keyRegex.exec(currentBlock)) !== null) {
          existing_keys.push(keyMatch[1]); // Add the captured key
        }
      }

      if (keyword2 && predefinedCompletions[keyword1][keyword2]) {
        for (const key of predefinedCompletions[keyword1][keyword2]) {
          // Check if the key is not in the existing_keys array
          if (!existing_keys.includes(key)) {
            suggestions.push({
              label: key,
              kind: CompletionItemKind.Variable,
              insertText: `${key}: `
            });
          }
        }
      }
    }

    // // Suggest keyword1
    // if (textBeforeCursor === "= ") {
    //   const keyword1 = 'keyword1_1';  // You can dynamically choose based on context
    //   const keyword2 = 'keyword2_1';  // Same here

    //   if (predefinedCompletions[keyword1] && predefinedCompletions[keyword1][keyword2]) {
    //     predefinedCompletions[keyword1][keyword2].forEach(key => {
    //       suggestions.push({
    //         label: key,
    //         kind: CompletionItemKind.Property,
    //       });
    //     });
    //   }
    // }

    // Suggest keyword2

    // Suggest keys

    // // Add simple keywords as suggestions
    // suggestions.push({
    //   label: 'function',
    //   kind: CompletionItemKind.Keyword,
    // });
    // suggestions.push({
    //   label: 'const',
    //   kind: CompletionItemKind.Keyword,
    // });
    // suggestions.push({
    //   label: 'let',
    //   kind: CompletionItemKind.Keyword,
    // });

    return { items: suggestions, isIncomplete: false };
  }
  return [];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

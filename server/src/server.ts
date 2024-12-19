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
        triggerCharacters: [" ", "\b"],
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

    // Generate completion items (example: simple keyword completions)
    const suggestions: CompletionItem[] = [];

    // Suggest keyword1
    if (textBeforeCursor.slice(-2) === "= ") {
      for (let keyword1 in predefinedCompletions) {
        suggestions.push({
          label: keyword1,
          kind: CompletionItemKind.Class,
        });
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
          });
        }
      }
    }

    // Suggest keys

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

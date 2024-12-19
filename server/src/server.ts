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
  TextDocumentPositionParams,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

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
        triggerCharacters: [" "],
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
      const text = document.getText();

      // Generate completion items (example: simple keyword completions)
      const suggestions: CompletionItem[] = [];

      // Add simple keywords as suggestions
      suggestions.push({
          label: 'function',
          kind: CompletionItemKind.Keyword,
      });
      suggestions.push({
          label: 'const',
          kind: CompletionItemKind.Keyword,
      });
      suggestions.push({
          label: 'let',
          kind: CompletionItemKind.Keyword,
      });

      return { items: suggestions, isIncomplete: false };
  }
  return [];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

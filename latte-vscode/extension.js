
// Create a basic VS Code extension
const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('latte');
    context.subscriptions.push(diagnosticCollection);

    let first = true;

    /**
     * Runs the type checker on the provided document and updates diagnostics.
     * @param {vscode.TextDocument} document
     * @param {vscode.DiagnosticCollection} diagnosticCollection
     */
    function runTypeChecker(document, diagnosticCollection) {
        const filePath = document.fileName;

        // Ensure the file exists
        if (!fs.existsSync(filePath)) {
            vscode.window.showErrorMessage(`File does not exist: ${filePath}`);
            return;
        }

        const path = require('path');
        // Replace this with the command to invoke your type checker
        const command = `java -jar "${path.join(__dirname, 'latte.jar')}" "${filePath}"`;

        console.log("Running type checker with command:", command);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error executing type checker:", error.message);
                // vscode.window.showErrorMessage(`Error running type checker: ${error.message}`);
                return;
            }

            console.log("Type checker stdout:", stdout);
            console.log("Type checker stderr:", stderr);

            if(stderr === '') {
                diagnosticCollection.delete(document.uri);
                return;
            }

            // Use a regex to extract the JSON part
            const jsonRegex = /{.*}/s; // Matches anything between curly braces, including newlines
            const match = stderr.match(jsonRegex);
            let errors = [];
            if (match) {
                try {
                    errors.push(JSON.parse(match[0])); // Parse the JSON string
                    console.log("Parsed JSON:", errors);
                    updateDiagnostics(document.uri, errors, diagnosticCollection);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                    return;
                }
            } else {
                diagnosticCollection.delete(document.uri);
                console.log("No JSON found in stderr.");
                return;
            }
        });
    }

    // Update diagnostics for a file
    function updateDiagnostics(fileUri, errors, diagnosticCollection) {
        const diagnostics = errors.map(err => {
            const range = new vscode.Range(
                new vscode.Position(err.startLine - 1, err.startColumn - 1),
                new vscode.Position(err.endLine - 1, err.endColumn)
            );

            console.log("Short Message", err.shortMessage)
            let diag = new vscode.Diagnostic(
                range,
                err.message,
                vscode.DiagnosticSeverity.Error
            );

            diag.source = "Latte";
            diag.relatedInformation = [
                new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(fileUri, range),
                    "See related usage here."
                )
            ];

            return diag;
        });

        diagnosticCollection.set(fileUri, diagnostics);
    }

    // Check if the file imports `specification.*`
    function shouldValidate(document) {
        const content = document.getText();
        const importRegex = /\bimport\s+specification/;

        return importRegex.test(content); // Returns true if `import specification.*` is found
    }


    vscode.workspace.onDidChangeTextDocument((changedDocument) => {
        let document = changedDocument.document;
        if (document.languageId === 'java') {
            // Ensure the file exists
            let x = document.uri.fsPath;
            if(shouldValidate(document)){            
                if(first){
                    first = false;
                    vscode.window.showInformationMessage("Latte running: Be Unique!");
                }
                if (fs.existsSync(document.uri.path)) {
                    runTypeChecker(document, diagnosticCollection);
                }
            }
        }
    })

}

/**
//  * This method is called when the extension is deactivated
//  */
// function deactivate() {}

module.exports = {
    activate
};

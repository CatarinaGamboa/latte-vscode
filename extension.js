
// Create a basic VS Code extension
const vscode = require('vscode');
const path = require("path");
const fs = require('fs');
const { spawn } = require("child_process");

let javaProcess = null; // Persistent Java process

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('latte');
    context.subscriptions.push(diagnosticCollection);

    let first = true;


    /**
     * Starts the Java process once and keeps it running
     */
    function startJavaProcess() {
        if (!javaProcess) {
            javaProcess = spawn("java", ["-XX:+TieredCompilation","-XX:TieredStopAtLevel=1", "-jar", path.join(__dirname, "latte.jar"), "-multi" ], {
                stdio: ["pipe", "pipe", "pipe"],
            });

            javaProcess.stdout.on("data", (data) => {
                console.log(`Java Output: ${data.toString()}`);
            });

            javaProcess.stderr.on("data", (data) => {
                console.error(`Java Error: ${data.toString()}`);
            });

            javaProcess.on("exit", (code) => {
                console.log(`Java process exited with code ${code}`);
                javaProcess = null; // Restart if needed
            });

            console.log("Latte Type Checker started!");
        }
    }


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

        if (!javaProcess) {
            startJavaProcess(); // Start Java process if it's not running
        }

        console.log(`Validating: ${filePath}`);
        javaProcess.stdin.write(filePath + "\n");

        javaProcess.stdout.on("data", (data) => {
            const stdin = data.toString();
            if (stdin.includes("SUCCESS")) {
                diagnosticCollection.delete(document.uri);
                return;
            }
        });

        javaProcess.stderr.once("data", (data) => {
            const stderr = data.toString();
            console.log("Type checker stderr:", stderr);
            if (stderr === "") {
                diagnosticCollection.delete(document.uri);
                return;
            }

            const jsonRegex = /{.*}/s; // Extract JSON errors
            const match = stderr.match(jsonRegex);
            let errors = [];
            if (match) {
                try {
                    errors.push(JSON.parse(match[0]));
                    updateDiagnostics(document.uri, errors, diagnosticCollection);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            } else {
                diagnosticCollection.delete(document.uri);
                console.log("No JSON found in stderr.");
            }
        });

        // const path = require('path');
        // // Replace this with the command to invoke your type checker
        // const command = `java -jar "${path.join(__dirname, 'latte.jar')}" "${filePath}"`;

        // console.log("Running type checker with command:", command);
        // exec(command, (error, stdout, stderr) => {
        //     if (error) {
        //         console.error("Error executing type checker:", error.message);
        //         // vscode.window.showErrorMessage(`Error running type checker: ${error.message}`);
        //         return;
        //     }

        //     console.log("Type checker stdout:", stdout);
        //     console.log("Type checker stderr:", stderr);

        //     if(stderr === '') {
        //         diagnosticCollection.delete(document.uri);
        //         return;
        //     }

        //     // Use a regex to extract the JSON part
        //     const jsonRegex = /{.*}/s; // Matches anything between curly braces, including newlines
        //     const match = stderr.match(jsonRegex);
        //     let errors = [];
        //     if (match) {
        //         try {
        //             errors.push(JSON.parse(match[0])); // Parse the JSON string
        //             console.log("Parsed JSON:", errors);
        //             updateDiagnostics(document.uri, errors, diagnosticCollection);
        //         } catch (error) {
        //             console.error("Error parsing JSON:", error);
        //             return;
        //         }
        //     } else {
        //         diagnosticCollection.delete(document.uri);
        //         console.log("No JSON found in stderr.");
        //         return;
        //     }
        // });
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
        return /\bimport\s+specification/.test(content); // Returns true if `import specification.*` is found
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
                
                runTypeChecker(document, diagnosticCollection);
                
            }
        }
    })

    context.subscriptions.push({
        dispose: () => {
            if (javaProcess) {
                javaProcess.kill();
            }
        },
    });

    startJavaProcess(); // Start Java process when extension activates
}

/**
 * Deactivates the extension
 */
function deactivate() {
    if (javaProcess) {
        javaProcess.kill();
    }
}

module.exports = {
    activate,
    deactivate
};

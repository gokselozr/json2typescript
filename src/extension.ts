import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.generateTypescriptInterface', () => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			let selection = editor.selection;
			let text = editor.document.getText(selection);
			let tsInterface = generateTypescriptInterface(text);

			let newText = text.replace(text, tsInterface);
			const edit = new vscode.WorkspaceEdit();
			edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), newText);
			vscode.languages.setTextDocumentLanguage(editor.document, 'typescript');
			vscode.workspace.applyEdit(edit);
			vscode.commands.executeCommand("editor.action.formatDocument");
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }


function generateTypescriptInterface(text: string, parent = 'Model') {
	let json = JSON.parse(text);
	let csharpCode = '';
	let modelCode = `interface ${toUpperCaseFirstLetter(parent)}\n{\n`;

	for (const key in json) {
		const type = typeof json[key];
		let csharpType = '';
		let datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/;

		switch (type) {
			case 'string':
				if (datePattern.test(json[key])) {
					csharpType = 'Date';
				}
				else {
					csharpType = 'string';
				}
				break;
			case 'number':
				csharpType = 'number';
				break;
			case 'boolean':
				csharpType = 'boolean';
				break;
			case 'object':
				if (Array.isArray(json[key])) {
					if (typeof json[key][0] === 'object') {
						csharpType = `Array<${toUpperCaseFirstLetter(key)}Model>`;
						csharpCode += generateTypescriptInterface(JSON.stringify(json[key][0]), `${toUpperCaseFirstLetter(key)}Model`);
					} else {
						csharpType = 'Array<any>';
					}
				}
				else if (json[key] !== null) {
					csharpType = `${toUpperCaseFirstLetter(key)}Model`;
					csharpCode += generateTypescriptInterface(JSON.stringify(json[key]), `${toUpperCaseFirstLetter(key)}Model`);
				}
				else {
					csharpType = 'any';
				}
				break;
			default:
				csharpType = 'any';
		}

		modelCode += `     ${toUpperCaseFirstLetter(key)}: ${csharpType};\n`;
	}

	modelCode += '}\n\n';

	return csharpCode + modelCode;
}


function toUpperCaseFirstLetter(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
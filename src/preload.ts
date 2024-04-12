import { ipcRenderer } from "electron";

export const blockElement = (element: HTMLElement) => {
	element.classList.add("is-disabled");
	element.classList.add("disabled");
	element.classList.add("is-loading");
	if (element instanceof HTMLInputElement) {
		element.disabled = true;
	}
};

export const unblockElement = (element: HTMLElement) => {
	element.classList.remove("is-disabled");
	element.classList.remove("disabled");
	element.classList.remove("is-loading");
	if (element instanceof HTMLInputElement) {
		element.disabled = false;
	}
};

const getSelectedFoldersHTML = (folders: string[]) => {
	return `
	<div>Selected folders</div>
	<ul>
		${folders.map((folder) => `<li><code>${folder}</code></li>`).join("")}
	</ul>
	`;
};

const openFolder = (folder: string) => {
	ipcRenderer.send("openFolder", { folder });
};

let outputFolder: string | undefined;
let folders: string[] = [];

window.addEventListener("DOMContentLoaded", () => {
	const buttonSelectFolders = document.getElementById("button-select-folders");
	const divFoldersContent = document.getElementById("folders-content");

	const buttonSelectOutputFolder = document.getElementById(
		"button-select-output-folder"
	);
	const divOutputFolder = document.getElementById("span-output-folder");

	const buttonRun = document.getElementById("button-run");

	ipcRenderer.send("getAppVersion");
	ipcRenderer.on("appVersion", (event, appVersion) => {
		document.getElementById("title").innerText = `K0 Combiner ${appVersion}`;
	});

	buttonSelectFolders.addEventListener("click", () => {
		blockElement(buttonSelectFolders);
		ipcRenderer.send("selectFolders");
	});
	ipcRenderer.on("selectFolders", (event, args) => {
		unblockElement(buttonSelectFolders);
		const { success, errorMessage } = args;
		if (!success && errorMessage) {
			divFoldersContent.innerHTML = ``;
			divFoldersContent.style.display = "none";
			alert(errorMessage);
			folders = [];
		} else {
			divFoldersContent.innerHTML = getSelectedFoldersHTML(args.folders);
			divFoldersContent.style.display = "block";
			folders = args.folders;
		}
	});

	buttonSelectOutputFolder.addEventListener("click", () => {
		blockElement(buttonSelectOutputFolder);
		ipcRenderer.send("selectOutputFolder");
	});
	ipcRenderer.on("selectOutputFolder", (event, args) => {
		unblockElement(buttonSelectOutputFolder);
		const { success, errorMessage } = args;
		console.log(success, errorMessage, outputFolder);
		if (!success && errorMessage) {
			divOutputFolder.innerHTML = ``;
			alert(errorMessage);
			outputFolder = undefined;
		} else {
			const button = document.createElement("button");
			button.classList.add("button");
			button.classList.add("is-danger");
			button.innerText = "Open output folder";
			button.addEventListener("click", () => openFolder(outputFolder));
			divOutputFolder.innerHTML = ``;
			divOutputFolder.appendChild(button);
			outputFolder = args.outputFolder;
		}
	});

	buttonRun.addEventListener("click", () => {
		if (!folders.length) {
			alert("No folders selected");
			return;
		}
		if (!outputFolder || outputFolder === "") {
			alert("No output folder selected");
			return;
		}
		blockElement(buttonRun);
		blockElement(buttonSelectFolders);
		blockElement(buttonSelectOutputFolder);
		ipcRenderer.send("run", { folders, outputFolder });
	});
	ipcRenderer.on("run", (event, args) => {
		const { success, errorMessage } = args;
		if (!success && errorMessage) {
			alert(errorMessage);
		}
		unblockElement(buttonRun);
		unblockElement(buttonSelectFolders);
		unblockElement(buttonSelectOutputFolder);
	});
});

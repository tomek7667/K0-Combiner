import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "path";
let win: any;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
	app.quit();
}

const createWindow = (): void => {
	win = new BrowserWindow({
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
			nodeIntegration: true,
		},
		width: 1270,
		height: 800,
		icon: path.join(__dirname, "images/favicon.png"),
	});

	win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
	// mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.on("getAppVersion", (event) => [
	event.sender.send("appVersion", app.getVersion()),
]);

ipcMain.on("selectFolders", (event) => {
	const folders = dialog.showOpenDialogSync(win, {
		properties: ["openDirectory", "multiSelections"],
		message: "Select folders to combine",
		buttonLabel: "Select",
		title: "Select folders that contain k0 files",
	});
	if (!folders) {
		return event.sender.send("selectFolders", {
			success: false,
			errorMessage: "No folders selected",
		});
	}
	event.sender.send("selectFolders", {
		success: true,
		folders,
	});
});

ipcMain.on("selectOutputFolder", (event) => {
	const outputFolder = dialog.showOpenDialogSync(win, {
		properties: ["openDirectory"],
		message: "Select output folder",
		buttonLabel: "Select",
		title: "Select output folder",
	});
	if (!outputFolder) {
		return event.sender.send("selectOutputFolder", {
			success: false,
			errorMessage: "No output folder selected",
		});
	}
	event.sender.send("selectOutputFolder", {
		success: true,
		outputFolder: outputFolder[0],
	});
});

ipcMain.on("openFolder", (event, { folder }) => {
	shell.openPath(folder);
});

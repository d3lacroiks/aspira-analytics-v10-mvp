const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let serverProcess;

const PORT = 8787;

function startServer() {
  return new Promise((resolve) => {
    const serverPath = path.join(__dirname, "server.js");
    serverProcess = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(PORT) },
      cwd: __dirname
    });

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      console.log("[server]", msg);
      if (msg.includes("corriendo en")) resolve();
    });

    serverProcess.stderr.on("data", (data) => {
      console.error("[server error]", data.toString());
    });

    // Fallback: si no responde en 3s igual abre la ventana
    setTimeout(resolve, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "public", "icons", "icon-512.png"),
    title: "ASPIRA Analytics",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: "#0b1220",
    show: false
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Mostrar ventana cuando esté lista (evita flash blanco)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Abrir links externos en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});

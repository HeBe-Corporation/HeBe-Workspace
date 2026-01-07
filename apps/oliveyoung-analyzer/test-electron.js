console.log("process.type:", process.type); if (process.type === "browser") { const electron = require("electron"); console.log("app:", electron.app); } else { console.log("Not in main process"); }

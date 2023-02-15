const path = require("path");
const os = require("os");
const fs = require("fs");
const child_process = require("child_process");
const fse = require("fs-extra");
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  shell,
  dialog,
} = require("electron");

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

let mainWindow;
let aboutWindow;

// Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 1000 : 500,
    height: 700,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Show devtools automatically if in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // mainWindow.loadURL(`file://${__dirname}/renderer/index.html`);
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// About Window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    title: "About Electron",
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// When the app is ready, create the window
app.on("ready", () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove variable from memory
  mainWindow.on("closed", () => (mainWindow = null));
});

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  // {
  //   label: 'File',
  //   submenu: [
  //     {
  //       label: 'Quit',
  //       click: () => app.quit(),
  //       accelerator: 'CmdOrCtrl+W',
  //     },
  //   ],
  // },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

ipcMain.on("generate:ad", (e, options) => {
  console.log("generate:ad", options);
  startGenerate(options);
});

ipcMain.on("preview:ad", (e, options) => {
  console.log(options);
  generatePreview(options);
});

ipcMain.on("zip:ad", (e, options) => {
  console.log(options);
  startAllZip(options);
});

ipcMain.on("project-folder:open", async (e) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  console.log(canceled, filePaths);
  if (canceled) {
    return;
  }
  mainWindow.webContents.send("project-folder:close", filePaths);
});

ipcMain.on("dest-dir:open", async (e, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  console.log(canceled, filePaths);
  if (canceled) {
    return;
  }

  mainWindow.webContents.send("dest-dir:close", filePaths);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});

// Open a window if none are open (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

/**
 *
 */
const editFolderIndex = (pathIndex, dim) => {
  fs.readFile(pathIndex, "utf-8", function (err, data) {
    if (err) throw err;

    const splits = dim.split("x");
    const dw = splits[0];
    const dh = splits[1];
    let indexContext = data.replace(
      /<\/style>/g,
      ".main_container { width: " + dw + "px; height: " + dh + "px; }</style>"
    );

    indexContext = indexContext.replace(
      /(?<=<meta name=\"ad.size\" )(.*?)(?=>)/,
      'content="width=' + dw + ",height=" + dh + '"'
    );

    fs.writeFile(pathIndex, indexContext, "utf-8", function (err, data) {
      if (err) throw err;
      console.log("Updated index: ", pathIndex);
    });
  });
};

const generateFolder = async (destDir, dim) => {
  const srcDir = "./_template/cent_template/";
  // console.log("generateFolder");

  // To copy a folder or file
  fse.copy(srcDir, destDir, { overwrite: false }, function (err) {
    if (err) throw err;
    console.log("Generate folder:", destDir, " dimension: ", dim);
    editFolderIndex(destDir + "/index.html", dim);
  });
};

const generateOtherFolders = async (dir) => {
  fse.ensureDirSync(dir, (err) => {
    if (err) throw err;
    console.log("Generate other folder:", dir);
  });
};

async function startGenerate(options) {
  const _getDir = path.join(options.projectFolder, options.campaignName);
  const _distDir = path.join(options.destDir, options.campaignName);
  const _dimensions = options.adSizes.split(",").map((a) => a.trim());

  _dimensions.forEach(async (obj) => {
    await generateFolder(
      path.join(_getDir, options.campaignName + "_" + obj),
      obj
    );
  });

  await generateOtherFolders(path.join(_getDir, "/all/"));
  await generateOtherFolders(path.join(_getDir, "/gif/"));
  await generateOtherFolders(path.join(_getDir, "/statics/"));

  shell.openPath(path.join(_getDir));
}

/**
 * preview
 */
const moment = require("moment-timezone");

const KNOWN_SIZES = [
  { name: "120x600", w: 120, h: 600 },
  { name: "160x600", w: 160, h: 600 },
  { name: "300x600", w: 300, h: 600 },
  { name: "300x250", w: 300, h: 250 },
  { name: "320x480", w: 320, h: 480 },
  { name: "336x280", w: 336, h: 280 },
  { name: "728x90", w: 728, h: 90 },
  { name: "1080x1080", w: 1080, h: 1080 },
  { name: "300x50", w: 300, h: 50 },
  { name: "320x50", w: 320, h: 50 },
  { name: "320x100", w: 320, h: 100 },
];

const date_created = moment
  .tz(new Date(), "America/New_York")
  .format("MMMM DD, YYYY h:mA z");

function generatePreview(options) {
  const INDEX_CURLY = {
    created: date_created,
    updated: date_created,
    campaign_name: options.campaignName,
    html: 0,
    gif: 0,
  };
  const _getDir = path.join(options.projectFolder, options.campaignName);
  const _distDir = path.join(options.destDir, options.campaignName);

  const folders = getDirectories(_getDir).filter((obj) => {
    if (obj === "all" || obj === "statics" || obj === "gif") return false;
    return obj;
  });

  // copy folders
  folders.forEach((obj) => {
    let srcDir = path.join(_getDir, obj);
    let destDir = path.join(_distDir, obj);

    fse.copySync(srcDir, destDir, { overwrite: true });

    console.log("folder copied:", srcDir, "->", destDir);
  });

  // copy gifs
  fse.copySync(path.join(_getDir, "gif"), path.join(_distDir, "gif"), {
    overwrite: true,
  });
  const gifs = fs.readdirSync(path.join(_distDir, "gif")).filter((obj) => {
    return obj.includes(".gif");
  });

  // update html and gif counts
  INDEX_CURLY.html = folders.length;
  INDEX_CURLY.gif = gifs.length;

  // generate main index.html
  fse.pathExists(_distDir + "/index.html", (err, exists) => {
    if (err) throw err;

    if (exists) {
      editMainIndex(options, INDEX_CURLY, folders, gifs);
    } else {
      generateMainIndex(options, INDEX_CURLY, folders, gifs);
    }
    removeDStore();
  });
}

function getDirectories(path) {
  return fs.readdirSync(path).filter(function (file) {
    let dir = fs.statSync(path + "/" + file).isDirectory();
    return dir;
  });
}

/**
 * generate the main index if it not exist
 * this will only update all of the double curly braces
 * */
function generateMainIndex(options, INDEX_CURLY, folders, gifs) {
  const _getDir = path.join(options.projectFolder, options.campaignName);
  const _distDir = path.join(options.destDir, options.campaignName);

  console.log("GENERATE MAIN INDEX");
  fse.copy(
    "./_template/cent_index.html",
    path.join(_distDir, "index.html"),
    { overwrite: true },
    function (err) {
      if (err) throw err;

      const pathIndex = path.join(_distDir, "index.html");

      fs.readFile(pathIndex, "utf-8", function (err, data) {
        if (err) throw err;

        // curly braces match
        let curly = data.match(/(?<={{)(.*?)(?=}})/g);

        let curlyStr = data;
        curly.forEach((obj) => {
          curlyStr = curlyStr.replace(/({{)(.*?)(}})/, INDEX_CURLY[obj]);
        });

        // populate <option> list
        let str = "";
        folders.forEach((obj) => {
          const size = KNOWN_SIZES.filter((key) => {
            return obj.includes(key.name);
          });

          const name = obj;
          const dw = size[0].w;
          const dh = size[0].h;

          str +=
            '\n<option value="' +
            name +
            '" w="' +
            dw +
            '" h="' +
            dh +
            '" src="' +
            name +
            '/index.html">' +
            name +
            "</option>";
        });

        let hasGif = false;
        gifs.forEach((obj) => {
          const size = KNOWN_SIZES.filter((key) => {
            return obj.includes(key.name);
          });

          const name = obj.split(".gif")[0];
          const dw = size[0].w;
          const dh = size[0].h;

          if (!hasGif) {
            str += "\n<option disabled>GIF</option>";
          }
          str +=
            '\n<option value="' +
            name +
            '" w="' +
            dw +
            '" h="' +
            dh +
            '" src="gif/' +
            obj +
            '">' +
            obj +
            "</option>";

          hasGif = true;
        });

        let indexContext = curlyStr.replace(
          /(?<=\<select(.*)>)(.*)(?=\<\/select>)/s,
          str
        );

        fs.writeFile(pathIndex, indexContext, "utf-8", function (err, data) {
          if (err) throw err;
          console.log("Done generating /projects main index.html");
        });
      });
    }
  );
}

/**
 * edit the main index if it exist
 * this will only update the `updated` value
 * */
function editMainIndex(options, INDEX_CURLY, folders, gifs) {
  const _getDir = path.join(options.projectFolder, options.campaignName);
  const _distDir = path.join(options.destDir, options.campaignName);

  console.log("EDIT MAIN INDEX");
  const pathIndex = _distDir + "/index.html";

  fs.readFile(pathIndex, "utf-8", function (err, data) {
    if (err) throw err;

    let updated = moment
      .tz(new Date(), "America/New_York")
      .format("MMMM DD, YYYY h:m A z");
    let indexContext = data.replace(
      /(?<=<span class=\"updated\">)(.*?)(?=<\/span>)/g,
      updated
    );

    let htmlCntr = folders.length;
    let gifsCntr = gifs.length;

    indexContext = indexContext.replace(
      /(?<=class="text-end">)(.*?)(?=<\/span>)/,
      htmlCntr + " html<br>" + gifsCntr + " gif"
    );

    // populate <option> list
    let str = "";
    folders.forEach((obj) => {
      if (obj === "gif" || obj === "static") return;
      const size = KNOWN_SIZES.filter((key) => {
        return obj.includes(key.name);
      });

      const name = obj;
      const dw = size[0].w;
      const dh = size[0].h;

      str +=
        '\n<option value="' +
        name +
        '" w="' +
        dw +
        '" h="' +
        dh +
        '" src="' +
        name +
        '/index.html">' +
        name +
        "</option>";
    });

    let hasGif = false;
    gifs.forEach((obj) => {
      const size = KNOWN_SIZES.filter((key) => {
        return obj.includes(key.name);
      });

      const name = obj.split(".gif")[0];
      const dw = size[0].w;
      const dh = size[0].h;

      if (!hasGif) {
        str += "\n<option disabled>GIF</option>";
      }
      str +=
        '\n<option value="' +
        name +
        '" w="' +
        dw +
        '" h="' +
        dh +
        '" src="gif/' +
        obj +
        '">' +
        obj +
        "</option>";

      hasGif = true;
    });

    indexContext = indexContext.replace(
      /(?<=\<select(.*)>)(.*)(?=\<\/select>)/s,
      str
    );

    fs.writeFile(pathIndex, indexContext, "utf-8", function (err, data) {
      if (err) throw err;
      console.log("Done updating /dist main index.html");
    });
  });
}

/**
 * remove DS_Store
 */
function removeDStore(options, INDEX_CURLY, folders, gifs) {
  const _getDir = path.join(options.projectFolder, options.campaignName);
  const _distDir = path.join(options.destDir, options.campaignName);

  folders.forEach((obj) => {
    console.log(obj);
    fs.rm(path.join(_distDir, obj, ".DS_Store"), { recursive: true }, (err) => {
      if (err) {
        // File deletion failed
        console.error(err.message);
        return;
      }
      console.log(
        "DS_Store deleted successfully in directory " + _distDir + "/" + obj
      );
    });
  });
  // gif folder

  fs.rm(path.join(_distDir, "gif", ".DS_Store"), { recursive: true }, (err) => {
    if (err) {
      // File deletion failed
      console.error(err.message);
      return;
    }
    console.log(
      "DS_Store deleted successfully in directory " + _distDir + "/gif"
    );
  });
}

/**
 * startAllZip
 */
function startAllZip(options) {
  const _getDir = path.join(options.projectFolder, options.campaignName);
  const _distDir = path.join(options.destDir, options.campaignName);

  // const folders = getDirectories(_getDir)
  const folders = getDirectories(_getDir).filter((obj) => {
    if (obj === "all") return false;
    return obj;
  });
  folders.forEach((key) => {
    // if (key === 'all') return

    try {
      child_process.execSync(`zip -r ../all/${key} *`, {
        cwd: _getDir + "/" + key,
      });
      console.log("zipped:", _getDir + "/" + key);
    } catch (e) {}
  });

  // create all zip
  const allZipName = options.campaignName + "_all";
  try {
    child_process.execSync(`zip ${allZipName} all/*.zip`, {
      cwd: _getDir,
    });
    console.log("zipped:", _getDir + "/all");
  } catch (e) {
    return;
  }

  fs.readFile(_distDir + "/index.html", "utf-8", (err, data) => {
    if (err) throw err;

    // var btnClass = data.match(/(?<=<a class=\")(.*?hidden.*?)(?=\")/s);
    // if (btnClass) {
    //   btnClass = btnClass[0].replace('hidden', '');
    // }
    // let indexContext = data.replace(/(?<=<a class=\")(.*?hidden.*?)(?=\")/, btnClass);

    let indexContext = data.replace(/(d-none)/, "");
    // indexContext = indexContext.replace(/(?<=<span class=\"text-end counts\">)(.*?)(?=<\/span>)/, htmlCntr + ' html<br>' + gifsCntr + ' gif')

    indexContext = indexContext.replace(
      /(?<=href=\")(.*)(?=\">DOWNLOAD)/,
      allZipName + ".zip"
    );

    fs.writeFile(
      _distDir + "/index.html",
      indexContext,
      "utf-8",
      (err, data) => {
        if (err) throw err;
        console.log("Done replacing index.html /assets/ path");

        // copyFile(_getDir + '/index.html', 'dist/love/' + CAMPAIGN_NAME + '/');
        // copyFile(_getDir + '/' + allZipName + '.zip', 'dist/love/' + CAMPAIGN_NAME + '/');
        fse.copy(
          path.join(_getDir, allZipName + ".zip"),
          path.join(_distDir, allZipName + ".zip")
        );
      }
    );
  });
}

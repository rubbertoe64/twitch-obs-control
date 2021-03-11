const path = require("path");
const OBSWebSocket = require("obs-websocket-js");
const { disconnect } = require('process');
const Store = require('./assets/js/store.js');
const { promises } = require('fs');
const fs = promises;
const shell = require('electron').shell;
const ComfyJS = require("comfy.js");
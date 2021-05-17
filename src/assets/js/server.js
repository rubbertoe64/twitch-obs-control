const { app } = require('electron');
const express = require('express');
const path = require('path');

class ExpressServer {
    app;
    port;

    constructor(port) {
        this.app = express();
        this.app.use(express.static('public'));
        this.port = port;
    }

    // start() {

    //     this.app.listen(this.port, () => {
    //         console.log(`Server listening at http://localhost:${this.port}`)
    //     });
    //     this.app.get('/', (req, res) => {
    //         res.sendFile(__dirname, path.join(''));
    //     })
    // }

    getApp() {
        return this.app;
    }

}

module.exports = ExpressServer;
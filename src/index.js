const {createHash} = require("crypto")
const {WebSocketServer, WebSocket} = require("ws");
const http = require("http");
const sqlite3 = require("sqlite3");
const server = http.createServer();
const wss = new WebSocketServer({server});
const db = sqlite3.verbose().Database;
const dbPath = new db("./src/database/local.db");
const arr = [];

wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
        const dataString = data.toString();
        if (dataString === "Hello darling, Vanderleia calling") {
            if (!arr.length) {
                return
            } 
            arr.forEach(value => {
                ws.send(value);
            })
            wss.clients.forEach(v => {
                ws.send("All data saved in Vanderleia");
            })
            return
        }
        const { message, latitude, longitude } = JSON.parse(dataString);
        const sql = `INSERT INTO localstorage (
            latitude, longitude, message)
            values (?, ?, ?)`
        const result = await new Promise((resolve, reject) => {
            dbPath.run(sql,[latitude, longitude, message],(err) => {
                if (err) {
                    ws.send("Failed saving data")
                    reject(err);
                } else {
                    ws.send("Data successfully saved on local database");
                    resolve();
                }
            })
        })
        const vanderleia = new WebSocket("ws://localhost:3334")
        vanderleia.on("open", function(){
            this.send(dataString)
        })
        vanderleia.on("error",() => {
            arr.push(dataString);
            ws.send("Connection error with Vanderleia");
        })
        vanderleia.on("message", async function(vanderleiaData) {
            const vanderleiaDataString = vanderleiaData.toString();
            ws.send(vanderleiaDataString);
        })
    })
})

server.once("listening", async () => {
    await new Promise((resolve, reject) => {
        dbPath.exec(`CREATE TABLE IF NOT EXISTS localstorage 
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude VARCHAR NOT NULL, 
        longitude VARCHAR NOT NULL,
        message VARCHAR(512) NOT NULL)`, (err) => {
            if (err) {
                console.log("Failed creating table")
                reject(err);
            } else {
                console.log("Table created!");
                resolve();
            }
        })
    })
})

server.listen(3333);
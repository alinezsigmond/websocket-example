const {WebSocketServer, WebSocket} = require("ws");
const http = require("http");
const sqlite3 = require("sqlite3");
const server = http.createServer();
const wss = new WebSocketServer({server});
const db = sqlite3.verbose().Database;
const dbPath = new db("./src/database/vanderleia.db");

wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
        const dataString = data.toString();
        const { message, latitude, longitude } = JSON.parse(dataString);
        const sql = `INSERT INTO vanderleia (
            latitude, longitude, message)
            values (?, ?, ?)`
        const result = await new Promise((resolve, reject) => {
            dbPath.run(sql,[latitude, longitude, message],(err) => {
                if (err) {
                    ws.send("Vanderleia says: Failed saving data")
                    reject(err);
                } else {
                    ws.send("Vanderleia says: Data successfully saved on local database");
                    resolve();
                }
            })
        })
    })
})

server.once("listening", async () => {
    await new Promise((resolve, reject) => {
        dbPath.exec(`CREATE TABLE IF NOT EXISTS vanderleia 
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude VARCHAR NOT NULL, 
        longitude VARCHAR NOT NULL,
        message VARCHAR(512) NOT NULL)`, (err) => {
            if (err) {
                console.log("Vanderleia says: Failed creating table")
                reject(err);
            } else {
                console.log("Vanderleia says: Table created!");
                resolve();
            }
        })
    })
    const localServer = new WebSocket("ws://localhost:3333")

    localServer.on("open", function() {
        this.send("Hello darling, Vanderleia calling");
        this.on("message", async (data) => {
            const dataString = data.toString();
        if (dataString == "All data saved in Vanderleia") return;

            const { message, latitude, longitude } = JSON.parse(dataString);
            const sql = `INSERT INTO vanderleia (
                latitude, longitude, message)
                values (?, ?, ?)`
            const result = await new Promise((resolve, reject) => {
                dbPath.run(sql,[latitude, longitude, message],(err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            })
        })
    })
})

server.listen(3334);
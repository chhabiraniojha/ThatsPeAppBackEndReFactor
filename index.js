// index.js
require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const { setupMaster } = require('@socket.io/sticky');

const numCPUs = os.cpus().length;;

if (cluster.isMaster) {
    const http = require('http');

    const httpServer = http.createServer();

    setupMaster(httpServer, {
        loadBalancingMethod: 'least-connection',
    });
    httpServer.on("connection", (socket) => {
        console.log(
            `[MASTER] TCP connection from ${socket.remoteAddress}:${socket.remotePort}`
        );

        socket.on("data", (buffer) => {
            console.log(
                `[MASTER] DATA RECEIVED (${buffer.length} bytes):`
            );

            console.log(
                buffer.toString().substring(0, 300)
            );
        });

        socket.on("end", () => {
            console.log("[MASTER] TCP END");
        });

        socket.on("close", (hadError) => {
            console.log(
                `[MASTER] TCP CLOSED | hadError=${hadError}`
            );
        });

        socket.on("error", (err) => {
            console.error(
                `[MASTER] TCP ERROR | ${err.code} | ${err.message}`
            );
        });
    });
    httpServer.listen(process.env.PORT, () => {
        console.log(`Server listening at ${process.env.PORT}`);
    });
        // IMPORTANT
    cluster.setupPrimary({
        serialization: "advanced",
    });
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        cluster.fork();
    });

} else {

    const Sentry = require('@sentry/node');

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',

        enableLogs: true,
    });

    const startServer = require('./server');

    startServer();
}
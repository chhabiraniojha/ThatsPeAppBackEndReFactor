const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { setupWorker } = require('@socket.io/sticky');

let io;

const initializeSocket = async  (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "*",
        },
 
        pingTimeout: 60000,
    });
    // Redis clients for pub/sub
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    //stable the connection sticky connection a
     setupWorker(io); // ✅ Enable sticky sessions here

    io.on("connection", (socket) => {
        // console.log("connected to socket.io 💥");
        // console.log(`💥 [Worker ${process.pid}] User connected with socket ID: ${socket.id}`);

        socket.on("join-room", ({ ticketId, role }) => {
            socket.join(ticketId);
            socket.ticketId = ticketId;
            // console.log(`Socket ${socket.id} joined room ${socket.ticketId}, role: ${role}`);
        });

        socket.on("executive-message", (data) => {
            const { ticketId, message } = data;
            // console.log(`Message from executive on ticket ${ticketId}: ${message}`);

            // Broadcast the message to the user in the same room
            io.to(ticketId).emit("receive-message", { sender: "executive", message });
        });

        // Handle user messages
        socket.on("user-message", (data) => {
            const { ticketId, message } = data;
            // console.log(`Message from user on ticket ${ticketId}: ${message}`);

            // Broadcast the message to the executive in the same room
            io.to(ticketId).emit("receive-message", { sender: "user", message });
        });
        // Handle Real Time Ticket Creation 
        socket.on("ticket-create", (data) => {
            const { ticketId } = data;
            // console.log("user creat a ticket and the ticket id is ------>", ticketId);
            io.emit("user-ticket-create", { ticketId })
        });


        //payment room create - Payment-related functionality
        socket.on("join-payment-room", ({ paymentId }) => {
            socket.join(paymentId);
            socket.paymentId = paymentId;
            // console.log(`Socket ${socket.id} joined payment room ${socket.paymentId} $$`);

            // io.to(paymentId).emit("paymet-process",{text:"hii this is the hi messege form payment controler"})
        });



        socket.on("disconnect", (reason) => {
            // console.log(`Socket ${socket.id} disconnected 💀`);
            //   console.log(` 💀[Worker ${process.pid}] User disconnected. Reason: ${reason}`);
            const ticketId = socket.ticketId;
            if (ticketId) {
                io.emit("update-ticket-status", { ticketId });
            }
        });
    });

    // return io;
};

const getSocketInstance = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized. Call initializeSocket first.");
    }
    return io;
};

module.exports = { initializeSocket, getSocketInstance };

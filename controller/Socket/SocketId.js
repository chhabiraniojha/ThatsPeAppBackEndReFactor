 
//  const io =require("socket.io") ;
const setupSocketIO = (server) => {
    const io = require('socket.io')(server, {
        cors: {
            origin: "*"
        },
        pingTimeout: 60000
    })
    

    let users = {}; // Store users connected

    io.on('connection', (socket) => {
         
        console.log('New client connected: 💥💥💥💥💥💥💥', socket.id);

        // // Store user and corresponding socket
        // socket.on('registerUser', (userId) => {
        //     users[userId] = socket.id;
        //     console.log(`User ${userId} connected with socket ID ${socket.id}`);
        // });

        // Handle chat message from user to executive
        // socket.on('userMessage', ({ userId, message }) => {
        //     console.log(`Message from user ${userId}: ${message}`);
        //     io.emit('messageFromUser', { userId, message });
        // });

        // Handle chat message from executive to user
        // socket.on('executiveMessage', ({ userId, message }) => {
        //     console.log(`Message to user ${userId}: ${message}`);
        //     const userSocketId = users[userId];
        //     if (userSocketId) {
        //         io.to(userSocketId).emit('messageFromExecutive', { message });
        //     } else {
        //         console.log(`User ${userId} is not connected.`);
        //     }
        // });

        // socket.on('disconnect', () => {
        //     console.log('Client disconnected:', socket.id);
        //     for (let userId in users) {
        //         if (users[userId] === socket.id) {
        //             delete users[userId];
        //             console.log(`User ${userId} removed.`);
        //             break;
        //         }
        //     }
        // });
    });
};

module.exports = setupSocketIO;

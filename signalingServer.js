const players = {}; // Store player names and their socket IDs

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register player with their name
    socket.on('registerPlayer', (playerName) => {
        players[playerName] = socket.id;
        console.log('Registered player:', playerName, 'with ID:', socket.id);
    });

    // Handle signaling
    socket.on('signal', (data) => {
        const { to, signal } = data;
        io.to(to).emit('signal', { from: socket.id, signal });
    });

    // Remove player on disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const player in players) {
            if (players[player] === socket.id) {
                delete players[player];
                break;
            }
        }
    });
});

socket.on('getOpponentId', (opponentName, callback) => {
    if (players[opponentName]) {
        callback(players[opponentName]); // Send the opponent's socket ID back
    } else {
        callback(null); // Opponent not found
    }
});
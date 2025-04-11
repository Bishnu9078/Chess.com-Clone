const socket = io('http://localhost:3000'); // Connect to signaling server
let localStream;
let peerConnection;

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Public STUN server
    ]
};

// Get microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
        localStream = stream;
    })
    .catch((error) => {
        console.error('Error accessing microphone:', error);
    });

// Handle incoming signals
socket.on('signal', async ({ from, signal }) => {
    if (!peerConnection) {
        createPeerConnection(from);
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    if (signal.type === 'offer') {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { to: from, signal: peerConnection.localDescription });
    }
});

// Create a peer connection
function createPeerConnection(peerId) {
    peerConnection = new RTCPeerConnection(servers);

    // Add local audio stream
    if (localStream) {
        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        });
    } else {
        console.error('Local stream is not available.');
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: peerId, signal: event.candidate });
        }
    };

    // Handle remote audio stream
    peerConnection.ontrack = (event) => {
        const remoteAudio = document.getElementById('remoteAudio');
        remoteAudio.srcObject = event.streams[0];
    };
}

// Start a call
async function startCall(peerId) {
    createPeerConnection(peerId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { to: peerId, signal: peerConnection.localDescription });
}

const playerName = prompt("Enter your name:"); // Ask the player for their name
socket.emit('registerPlayer', playerName); // Send the name to the server

function getOpponentId(opponentName, callback) {
    socket.emit('getOpponentId', opponentName, (opponentId) => {
        if (opponentId) {
            callback(opponentId); // Pass the opponent's ID to the callback
        } else {
            alert("Opponent not found!"); // Show an error if the opponent is not found
        }
    });
}

function startVoiceChat() {
    const opponentName = prompt("Enter your opponent's name:"); // Ask for the opponent's name
    getOpponentId(opponentName, (opponentId) => {
        startCall(opponentId); // Start the voice chat with the opponent's ID
    });
}
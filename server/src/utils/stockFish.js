const { spawn } = require('child_process');

// Spawn Stockfish engine
const stockfish = spawn('stockfish');

// Initialize engine
 stockfish.stdin.write('uci\n');
 stockfish.stdin.write('isready\n');

// Improve performance on Pi 5
 stockfish.stdin.write('setoption name Threads value 4\n');
 stockfish.stdin.write('setoption name Hash value 256\n');


 
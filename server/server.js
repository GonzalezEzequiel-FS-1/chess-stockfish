const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors()); // allow cross-origin requests
app.use(express.json()); // parse JSON requests

// Spawn Stockfish engine
const stockfish = spawn('stockfish');

stockfish.stdout.on('data', (data) => {
  console.log('Stockfish:', data.toString());
});

// Initialize engine
stockfish.stdin.write('uci\n');
stockfish.stdin.write('isready\n');

// Optional: improve performance on Pi 5
stockfish.stdin.write('setoption name Threads value 4\n');
stockfish.stdin.write('setoption name Hash value 256\n');

// Route to analyze moves
app.post('/api/analyze', async (req, res) => {
  const { moves = [], depth = 10 } = req.body;

  if (!Array.isArray(moves)) return res.status(400).json({ error: 'Moves must be an array' });

  // Send moves to Stockfish
  stockfish.stdin.write(`position startpos moves ${moves.join(' ')}\n`);
  stockfish.stdin.write(`go depth ${depth}\n`);

  let output = '';
  const listener = (data) => {
    output += data.toString();
    if (data.toString().includes('bestmove')) {
      stockfish.stdout.off('data', listener);
      res.json({ analysis: output });
    }
  };

  stockfish.stdout.on('data', listener);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Stockfish server running on http://localhost:${PORT}`);
});

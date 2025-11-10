const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const morgan = require('morgan')
const app = express();
dotenv.config();
const PORT = process.env.PORT || 3069;
app.use(cors()); // allow cross-origin requests
app.use(express.json()); // parse JSON requests
app.use(morgan('dev'))

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

  if (!Array.isArray(moves)) return res.status(400).json({ error: 'Moes must be an array' });

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

app.get('/test',(req,res)=>{
  try {
    return res.status(200).json({
      success:false,
      message:"Server Works"
    })}catch(err){
    return res.status(500).json({
        success:false,
        message:err
      })
  }
})

  // Route to play a move
app.post('/api/play', async (req, res) => {
  const { moves = [], depth = 10 } = req.body;

  if (!Array.isArray(moves)) {
    return res.status(400).json({ error: 'Moves must be an array' });
  }

  // Send current position to Stockfish
  stockfish.stdin.write(`position startpos moves ${moves.join(' ')}\n`);
  stockfish.stdin.write(`go depth ${depth}\n`);

  let output = '';
  const listener = (data) => {
    const text = data.toString();
    output += text;

    if (text.includes('bestmove')) {
      const match = text.match(/bestmove\s+(\S+)/);
      const bestMove = match ? match[1] : null;

      stockfish.stdout.off('data', listener);
      res.json({ bestMove, raw: output });
    }
  };

  stockfish.stdout.on('data', listener);
});



  // Start server

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Stockfish server running on Port:${PORT}`);
});

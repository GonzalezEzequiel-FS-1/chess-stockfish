const { spawn } = require("child_process");

const stockfish = spawn("stockfish");

// Configure Stockfish
stockfish.stdin.write("uci\n");
stockfish.stdin.write("isready\n");
stockfish.stdin.write("setoption name Threads value 4\n");
stockfish.stdin.write("setoption name Hash value 256\n");

stockfish.stdout.on("data", (data) => {
  console.log("Stockfish:", data.toString());
});

const analyze = async (req, res) => {
  const { moves = [], depth = 10 } = req.body;

  if (!Array.isArray(moves))
    return res.status(400).json({ error: "Moves must be an array" });

  stockfish.stdin.write(`position startpos moves ${moves.join(" ")}\n`);
  stockfish.stdin.write(`go depth ${depth}\n`);

  let output = "";
  const listener = (data) => {
    output += data.toString();
    if (output.includes("bestmove")) {
      stockfish.stdout.off("data", listener);
      res.json({ analysis: output });
    }
  };
  stockfish.stdout.on("data", listener);
};

const play = async (req, res) => {
  const { moves = [], depth = 10 } = req.body;

  if (!Array.isArray(moves))
    return res.status(400).json({ error: "Moves must be an array" });

  stockfish.stdin.write(`position startpos moves ${moves.join(" ")}\n`);
  stockfish.stdin.write(`go depth ${depth}\n`);

  let output = "";
  const listener = (data) => {
    const text = data.toString();
    output += text;

    if (text.includes("bestmove")) {
      const match = text.match(/bestmove\s+(\S+)/);
      const bestMove = match ? match[1] : null;

      stockfish.stdout.off("data", listener);
      res.json({ bestMove, raw: output });
    }
  };

  stockfish.stdout.on("data", listener);
};

const test = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Server Works",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || err,
    });
  }
};

module.exports = { analyze, play, test };

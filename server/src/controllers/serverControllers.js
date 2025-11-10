const { spawn } = require("child_process");

// ----------------------
// Stockfish Engine Setup
// ----------------------
const stockfish = spawn("stockfish");

stockfish.stdin.write("uci\n");
stockfish.stdin.write("isready\n");
stockfish.stdin.write("setoption name Threads value 4\n");
stockfish.stdin.write("setoption name Hash value 256\n");

let moveHistory = [];
let infiniteSearch = false;

// Helper: listen once for bestmove from Stockfish
function sendToStockfish(commands, waitForBestMove = true) {
  return new Promise((resolve, reject) => {
    let output = "";
    const listener = (data) => {
      const text = data.toString();
      output += text;
      if (waitForBestMove && text.includes("bestmove")) {
        stockfish.stdout.off("data", listener);
        resolve(output);
      }
    };
    stockfish.stdout.on("data", listener);
    commands.forEach((cmd) => stockfish.stdin.write(cmd + "\n"));
  });
}

// Helper: parse Stockfish UCI output into structured JSON
function parseStockfishOutput(raw) {
  const lines = raw.split("\n");
  let bestMove = null;
  let evaluation = null;
  let PV = [];
  let depth = null;
  let nodes = null;
  let nps = null;

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith("info")) {
      const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
      if (scoreMatch) {
        const type = scoreMatch[1];
        const val = parseInt(scoreMatch[2], 10);
        evaluation = type === "cp" ? val : `mate ${val}`;
      }
      const pvMatch = line.match(/pv (.+)$/);
      if (pvMatch) PV = pvMatch[1].split(" ");
      const depthMatch = line.match(/depth (\d+)/);
      if (depthMatch) depth = parseInt(depthMatch[1], 10);
      const nodesMatch = line.match(/nodes (\d+)/);
      if (nodesMatch) nodes = parseInt(nodesMatch[1], 10);
      const npsMatch = line.match(/nps (\d+)/);
      if (npsMatch) nps = parseInt(npsMatch[1], 10);
    }
    if (line.startsWith("bestmove")) {
      bestMove = line.split(" ")[1];
    }
  });

  return { bestMove, evaluation, PV, depth, nodes, nps };
}

// ----------------------
// Controllers
// ----------------------

// 1. Health check
const test = async (req, res) => {
  res.status(200).json({ success: true, message: "Server works" });
};

// 2. Play / Best Move
const play = async (req, res) => {
  const { moves = [], depth = 10 } = req.body;
  if (!Array.isArray(moves))
    return res.status(400).json({ error: "Moves must be an array" });

  moveHistory = [...moves];
  const cmds = [
    `position startpos moves ${moveHistory.join(" ")}`,
    `go depth ${depth}`,
  ];

  try {
    const raw = await sendToStockfish(cmds);
    res.json(parseStockfishOutput(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Analyze (raw)
const analyze = async (req, res) => {
  const { moves = [], depth = 10 } = req.body;
  moveHistory = [...moves];
  const cmds = [
    `position startpos moves ${moveHistory.join(" ")}`,
    `go depth ${depth}`,
  ];

  try {
    const raw = await sendToStockfish(cmds);
    res.json({ analysis: raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Analyze JSON (structured)
const analyzeJson = async (req, res) => {
  const { moves = [], depth = 10, multiPV = 1 } = req.body;
  moveHistory = [...moves];
  stockfish.stdin.write(`setoption name MultiPV value ${multiPV}\n`);
  const cmds = [
    `position startpos moves ${moveHistory.join(" ")}`,
    `go depth ${depth}`,
  ];

  try {
    const raw = await sendToStockfish(cmds);
    const lines = raw
      .split("\n")
      .filter((l) => l.startsWith("info") && l.includes("pv"));
    const bestMoves = lines.map(parseStockfishOutput);
    res.json({ movesAnalyzed: moveHistory, bestMoves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. MultiPV Analysis
const analyzeMulti = async (req, res) => {
  const { moves = [], depth = 10, multiPV = 3 } = req.body;
  moveHistory = [...moves];
  stockfish.stdin.write(`setoption name MultiPV value ${multiPV}\n`);
  const cmds = [
    `position startpos moves ${moveHistory.join(" ")}`,
    `go depth ${depth}`,
  ];

  try {
    const raw = await sendToStockfish(cmds);
    const lines = raw
      .split("\n")
      .filter((l) => l.startsWith("info") && l.includes("pv"));
    const bestMoves = lines.map(parseStockfishOutput);
    res.json({ movesAnalyzed: moveHistory, bestMoves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Analyze FEN
const analyzeFEN = async (req, res) => {
  const { fen, depth = 10 } = req.body;
  if (!fen) return res.status(400).json({ error: "FEN required" });

  const cmds = [`position fen ${fen}`, `go depth ${depth}`];

  try {
    const raw = await sendToStockfish(cmds);
    res.json(parseStockfishOutput(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Performance
const performance = async (req, res) => {
  // Stockfish does not keep persistent stats automatically, placeholder
  res.json({ nodes: 0, nps: 0, depth: 0, time: 0 });
};

// 8. New Game
const newGame = async (req, res) => {
  moveHistory = [];
  stockfish.stdin.write("ucinewgame\n");
  res.json({ success: true, message: "Engine state reset" });
};

// 9. Undo
const undo = async (req, res) => {
  const { steps = 1 } = req.body;
  moveHistory.splice(-steps, steps);
  res.json({
    success: true,
    message: `Last ${steps} move(s) undone`,
    moves: moveHistory,
  });
};

// 10. Config
const config = async (req, res) => {
  const { Threads, Hash, Skill, MultiPV, Ponder } = req.body;
  if (Threads !== undefined)
    stockfish.stdin.write(`setoption name Threads value ${Threads}\n`);
  if (Hash !== undefined)
    stockfish.stdin.write(`setoption name Hash value ${Hash}\n`);
  if (Skill !== undefined)
    stockfish.stdin.write(`setoption name Skill Level value ${Skill}\n`);
  if (MultiPV !== undefined)
    stockfish.stdin.write(`setoption name MultiPV value ${MultiPV}\n`);
  if (Ponder !== undefined)
    stockfish.stdin.write(`setoption name Ponder value ${Ponder}\n`);
  res.json({ success: true, message: "Configuration updated" });
};

// 11. Infinite Search
const goInfinite = async (req, res) => {
  const { moves = [] } = req.body;
  moveHistory = [...moves];
  infiniteSearch = true;
  stockfish.stdin.write(`position startpos moves ${moveHistory.join(" ")}\n`);
  stockfish.stdin.write("go infinite\n");
  res.json({ success: true, message: "Infinite search started" });
};

// 12. Stop Infinite Search
const stop = async (req, res) => {
  if (infiniteSearch) stockfish.stdin.write("stop\n");
  infiniteSearch = false;
  res.json({ success: true, message: "Search stopped" });
};

// 13. Analyze PGN
const analyzePGN = async (req, res) => {
  const { pgn } = req.body;
  if (!pgn) return res.status(400).json({ error: "PGN required" });

  // TODO: parse PGN into moves
  const moves =
    pgn
      .match(/\d+\.\s*([a-hKQRNB1-8=]+)\s+([a-hKQRNB1-8=]+)/g)
      ?.flatMap((m) => m.split(/\s+/).slice(1)) || [];
  moveHistory = [...moves];

  const cmds = [
    `position startpos moves ${moveHistory.join(" ")}`,
    `go depth 10`,
  ];

  try {
    const raw = await sendToStockfish(cmds);
    const bestMove = parseStockfishOutput(raw);
    res.json({ moves: moveHistory, evaluations: [bestMove] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------
// Export Controllers
// ----------------------
module.exports = {
  test,
  play,
  analyze,
  analyzeJson,
  analyzeMulti,
  analyzeFEN,
  performance,
  newGame,
  undo,
  config,
  goInfinite,
  stop,
  analyzePGN,
};

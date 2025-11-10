import { Chessboard } from "react-chessboard";
import { useState, useRef } from "react";
import { Chess } from "chess.js";
import { Button, Stack, Text } from "@mantine/core";

export default function GameBoard() {
  const chessRef = useRef(new Chess()); // chess.js instance
  const [position, setPosition] = useState<string>(chessRef.current.fen());
  const [history, setHistory] = useState<string[]>([]);

  // Handle player move
  const handleMove = (source: string, target: string): boolean => {
    const chess = chessRef.current;
    const move = chess.move({ from: source, to: target, promotion: "q" });
    if (!move) return false; // illegal move

    // Update board position & history
    setPosition(chess.fen());
    setHistory(chess.history());
    return true; // accept move
  };

  // Undo last two moves (player + hypothetical engine)
  const handleUndo = () => {
    const chess = chessRef.current;
    chess.undo(); // undo last move
    setPosition(chess.fen());
    setHistory(chess.history());
  };

  // Reset board
  const handleNewGame = () => {
    const chess = chessRef.current;
    chess.reset();
    setPosition(chess.fen());
    setHistory([]);
  };

  return (
    <Stack spacing="md" align="center">
      <Chessboard
        position={position}
        onPieceDrop={handleMove}
        boardWidth={400}
      />

      <Stack spacing="xs">
        <Button onClick={handleNewGame}>New Game</Button>
        <Button onClick={handleUndo}>Undo</Button>
        <Text>
          <strong>Move History:</strong>{" "}
          {history.length > 0 ? history.join(", ") : "–"}
        </Text>
      </Stack>
    </Stack>
  );
}

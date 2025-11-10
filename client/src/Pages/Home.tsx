import { Container, Stack, Title } from "@mantine/core";
import React from "react";
import GameBoard from "../Component/GameBoard";

export default function Home() {
  return (
    <Container size="md" py="xl">
      <Stack spacing="md" align="center">
        <Title order={1}>Play Chess</Title>
        <GameBoard />
      </Stack>
    </Container>
  );
}

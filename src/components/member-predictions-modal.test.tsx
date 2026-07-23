import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/actions/predictions", () => ({ getMemberPredictions: vi.fn() }));

import { getMemberPredictions } from "@/lib/actions/predictions";
import { MemberPredictionsModal } from "./member-predictions-modal";

describe("MemberPredictionsModal", () => {
  it("muestra un botón con el nombre del integrante", () => {
    render(<MemberPredictionsModal groupId="g1" userId="u1" name="Ana" />);
    expect(screen.getByRole("button", { name: "Ana" })).toBeInTheDocument();
  });

  it("al abrir carga y muestra las predicciones del integrante", async () => {
    vi.mocked(getMemberPredictions).mockResolvedValue({
      ok: true,
      name: "Ana",
      rows: [
        {
          matchId: 1,
          matchNumber: 1,
          kickoff: new Date("2026-06-11T18:00:00Z"),
          stage: "GROUP",
          homeTeam: { name: "Argentina", fifaCode: "ARG" },
          awayTeam: { name: "Brasil", fifaCode: "BRA" },
          homePlaceholder: null,
          awayPlaceholder: null,
          homeScore: 2,
          awayScore: 1,
          finished: true,
          predHome: 2,
          predAway: 0,
          points: 1,
        },
      ],
    });
    const user = userEvent.setup();
    render(<MemberPredictionsModal groupId="g1" userId="u1" name="Ana" />);

    await user.click(screen.getByRole("button", { name: "Ana" }));

    expect(getMemberPredictions).toHaveBeenCalledWith("g1", "u1");
    expect(
      await screen.findByRole("dialog", { name: "Predicciones de Ana" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Argentina")).toBeInTheDocument();
  });
});

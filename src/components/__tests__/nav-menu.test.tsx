import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({ logout: vi.fn() }));

import { NavMenu } from "../nav-menu";

describe("NavMenu", () => {
  it("muestra los enlaces y el nombre, sin el de admin para un usuario normal", () => {
    render(<NavMenu isAdmin={false} userName="Ana" />);
    expect(screen.getByRole("link", { name: "Partidos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grupos" })).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("muestra el enlace de Admin para un administrador", () => {
    render(<NavMenu isAdmin userName="Root" />);
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./error";

afterEach(() => vi.restoreAllMocks());

function makeError(over: Partial<Error & { digest?: string }> = {}) {
  return Object.assign(new Error("boom"), over) as Error & { digest?: string };
}

describe("Error boundary de página", () => {
  it("muestra el mensaje amable y registra el error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={makeError()} unstable_retry={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Algo salió mal" })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("[app error]", expect.anything(), expect.anything());
  });

  it("muestra el código de error cuando hay digest", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={makeError({ digest: "abc123" })} unstable_retry={vi.fn()} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it("no muestra código de error sin digest", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={makeError()} unstable_retry={vi.fn()} />);
    expect(screen.queryByText(/Código de error/)).not.toBeInTheDocument();
  });

  it("invoca unstable_retry al pulsar Reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBoundary error={makeError()} unstable_retry={retry} />);
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

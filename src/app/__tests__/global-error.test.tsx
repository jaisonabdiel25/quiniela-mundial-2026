import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalError from "../global-error";

afterEach(() => vi.restoreAllMocks());

describe("GlobalError (red de seguridad del layout raíz)", () => {
  it("muestra el mensaje y registra el error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GlobalError error={new Error("boom")} unstable_retry={vi.fn()} />);
    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("[global error]", expect.anything(), expect.anything());
  });

  it("invoca unstable_retry al pulsar Reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<GlobalError error={new Error("boom")} unstable_retry={retry} />);
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

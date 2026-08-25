import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Tooltip from "../ui/Tooltip";

describe("Tooltip", () => {
  it("renders the trigger children", () => {
    render(
      <Tooltip label="Full title text">
        <button>Trigger</button>
      </Tooltip>
    );
    expect(screen.getByRole("button", { name: "Trigger" })).toBeInTheDocument();
  });

  it("shows the label content on focus", async () => {
    render(
      <Tooltip label="Full title text">
        <button>Trigger</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByRole("button", { name: "Trigger" }));
    await waitFor(() =>
      expect(screen.getAllByText("Full title text").length).toBeGreaterThan(0)
    );
  });
});

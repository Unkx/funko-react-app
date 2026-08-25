import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Skeleton, { ListRowSkeleton, CardSkeleton, StatSkeleton } from "../ui/Skeleton";

describe("Skeleton", () => {
  it("renders a single pulse block with the given className", () => {
    render(<Skeleton className="h-4 w-32" data-testid="base-skeleton" />);
    const el = screen.getByTestId("base-skeleton");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("h-4");
    expect(el).toHaveClass("w-32");
  });

  it("ListRowSkeleton renders the requested number of rows", () => {
    render(<ListRowSkeleton count={3} />);
    expect(screen.getAllByTestId("list-row-skeleton")).toHaveLength(3);
  });

  it("CardSkeleton renders the requested number of cards", () => {
    render(<CardSkeleton count={2} />);
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(2);
  });

  it("StatSkeleton renders the requested number of stat tiles", () => {
    render(<StatSkeleton count={4} />);
    expect(screen.getAllByTestId("stat-skeleton")).toHaveLength(4);
  });
});

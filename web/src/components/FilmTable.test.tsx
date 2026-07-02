import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FilmTable } from "./FilmTable";
import type { Film } from "../types/domain";

const films: Film[] = [
  {
    id: "film-1",
    title: "The Matrix",
    type_id: "type-1",
    type: { id: "type-1", name: "Sci-Fi" },
  },
];

describe("FilmTable", () => {
  it("shows an empty state (not an error) when there are no films", () => {
    render(
      <MemoryRouter>
        <FilmTable films={[]} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/no films/i);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the Type value as a link to the filtered films view", () => {
    render(
      <MemoryRouter>
        <FilmTable films={films} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Sci-Fi" });
    expect(link).toHaveAttribute("href", "/films?type=type-1");
  });
});

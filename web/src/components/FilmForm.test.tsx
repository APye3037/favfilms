import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilmForm } from "./FilmForm";
import type { FilmType } from "../types/domain";

const types: FilmType[] = [
  { id: "type-1", name: "Drama" },
  { id: "type-2", name: "Comedy" },
];

describe("FilmForm", () => {
  it("does not call onSubmit when the title is blank", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<FilmForm types={types} submitLabel="Add film" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /add film/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/film is required/i)).toBeInTheDocument();
  });

  it("does not call onSubmit when the title exceeds 200 characters", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<FilmForm types={types} submitLabel="Add film" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/film/i), "a".repeat(201));
    await user.click(screen.getByRole("button", { name: /add film/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/200 characters or fewer/i)).toBeInTheDocument();
  });

  it("calls onSubmit with trimmed title and selected type when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<FilmForm types={types} submitLabel="Add film" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/film/i), "  Inception  ");
    await user.selectOptions(screen.getByLabelText(/type/i), "type-2");
    await user.click(screen.getByRole("button", { name: /add film/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Inception",
      type_id: "type-2",
    });
  });

  it("displays a server-provided error (e.g. duplicate title)", () => {
    render(
      <FilmForm
        types={types}
        submitLabel="Add film"
        onSubmit={vi.fn()}
        serverError="A film with that title already exists. Please use a different title."
      />,
    );

    expect(
      screen.getByText(/a film with that title already exists/i),
    ).toBeInTheDocument();
  });
});

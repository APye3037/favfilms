import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReassignTypeDialog } from "./ReassignTypeDialog";
import type { FilmType } from "../types/domain";

const drama: FilmType = { id: "type-drama", name: "Drama" };
const comedy: FilmType = { id: "type-comedy", name: "Comedy" };

describe("ReassignTypeDialog", () => {
  it("blocks deletion with a clear message when no other type exists", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ReassignTypeDialog
        typeToDelete={drama}
        filmCount={3}
        allTypes={[drama]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /no other type to reassign/i,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("lists only OTHER existing types (excludes the type being deleted) when alternatives exist", () => {
    render(
      <ReassignTypeDialog
        typeToDelete={drama}
        filmCount={2}
        allTypes={[drama, comedy]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Comedy");
  });

  it("calls onConfirm with the selected target type id when confirmed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ReassignTypeDialog
        typeToDelete={drama}
        filmCount={1}
        allTypes={[drama, comedy]}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /reassign and delete/i }));

    expect(onConfirm).toHaveBeenCalledWith("type-comedy");
  });

  it("cancelling makes no confirm call and nothing changes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ReassignTypeDialog
        typeToDelete={drama}
        filmCount={1}
        allTypes={[drama, comedy]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders a server error message when provided", () => {
    render(
      <ReassignTypeDialog
        typeToDelete={drama}
        filmCount={1}
        allTypes={[drama, comedy]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        serverError="target type does not exist"
      />,
    );

    expect(screen.getByText("target type does not exist")).toBeInTheDocument();
  });
});

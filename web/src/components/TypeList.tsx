import type { FilmType } from "../types/domain";

interface TypeListProps {
  types: FilmType[];
  onEdit: (type: FilmType) => void;
  onDelete: (type: FilmType) => void;
}

export function TypeList({ types, onEdit, onDelete }: TypeListProps) {
  if (types.length === 0) {
    return (
      <p className="empty-state" role="status">
        No types yet — add one to get started.
      </p>
    );
  }

  return (
    <ul className="type-list">
      {types.map((type) => (
        <li key={type.id} className="type-list__item">
          <span>{type.name}</span>
          <span className="type-list__actions">
            <button type="button" onClick={() => onEdit(type)}>
              Edit
            </button>
            <button type="button" onClick={() => onDelete(type)}>
              Delete
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

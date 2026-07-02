import { Link } from "react-router-dom";
import type { Film } from "../types/domain";

interface FilmTableProps {
  films: Film[];
  onEdit: (film: Film) => void;
  onDelete: (film: Film) => void;
}

export function FilmTable({ films, onEdit, onDelete }: FilmTableProps) {
  if (films.length === 0) {
    return (
      <p className="empty-state" role="status">
        No films to show yet.
      </p>
    );
  }

  return (
    <table className="film-table">
      <thead>
        <tr>
          <th>Film</th>
          <th>Type</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {films.map((film) => (
          <tr key={film.id}>
            <td>{film.title}</td>
            <td>
              {film.type ? (
                <Link to={`/films?type=${film.type.id}`}>{film.type.name}</Link>
              ) : (
                "Unknown"
              )}
            </td>
            <td className="film-table__actions">
              <button type="button" onClick={() => onEdit(film)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(film)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

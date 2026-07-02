export interface FilmType {
  id: string;
  name: string;
}

export interface Film {
  id: string;
  title: string;
  type_id: string;
  type?: FilmType;
}

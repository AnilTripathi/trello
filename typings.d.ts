interface Board {
  columns: Map<TypedColumn, Column>;
}

type TypedColumn = "todo" | "inprogress" | "done";

interface Column {
  id: TypedColumn;
  todos: Todo[];
}

interface Todo {
  $id: string;
  $createdAt: string;
  title: string;
  description: string;
  status: TypedColumn;
  image?: Image | null;
}

interface Image {
  bucketId: string;
  fileId: string;
}

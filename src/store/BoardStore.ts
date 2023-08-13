import { ID, databases, storage } from "@/appwrite";
import { getTodosGroupedByColumn } from "@/lib/getTodosBroupedByColumn";
import uploadImage from "@/lib/uploadImage";
import { type } from "os";
import { create } from "zustand";

interface BoardStore {
  board: Board;
  getBoard: () => void;
  setBoardState: (board: Board) => void;
  updateTodoInDB: (todo: Todo, columnID: TypedColumn) => void;
  searchString: string;
  setSearchString: (searchString: string) => void;
  deleteTask: (index: number, todo: Todo, id: TypedColumn) => void;
  newTaskInput: string;
  setNewTaskInput: (taskInput: string) => void;
  newTaskType: TypedColumn;
  setNewTaskType: (type: TypedColumn) => void;
  newDescription: string;
  setNewDescription: (description: string) => void;
  image: File | null;
  setImage: (file: File | null) => void;
  addTask: (
    todo: string,
    description: string,
    columnId: TypedColumn,
    image?: File | null
  ) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  board: {
    columns: new Map<TypedColumn, Column>(),
  },

  searchString: "",
  newTaskInput: "",
  newTaskType: "todo",
  newDescription: "",
  image: null,
  setSearchString: (searchString) => set({ searchString }),

  getBoard: async () => {
    const board = await getTodosGroupedByColumn();
    set({ board });
  },

  setBoardState: (board) => set({ board }),

  updateTodoInDB: async (todo, columnID) => {
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id,
      {
        title: todo.title,
        status: columnID,
      }
    );
  },
  deleteTask: async (index: number, todo: Todo, id: TypedColumn) => {
    const newColumns = new Map(get().board.columns);
    newColumns.get(id)?.todos.splice(index, 1);
    set({ board: { columns: newColumns } });
    if (todo?.image) {
      await storage.deleteFile(todo.image.bucketId, todo.image.fileId);
    }
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id
    );
  },
  setNewTaskInput: (inputTask: string) => set({ newTaskInput: inputTask }),
  setNewTaskType: (type: TypedColumn) => set({ newTaskType: type }),
  setNewDescription: (description: string) =>
    set({ newDescription: description }),
  setImage: (file: File | null) => set({ image: file }),
  addTask: async (
    todo: string,
    description: string,
    columnId: TypedColumn,
    image?: File | null
  ) => {
    let file: Image | undefined;
    if (image) {
      const fileUploaded = await uploadImage(image);
      if (fileUploaded) {
        file = {
          bucketId: fileUploaded.bucketId,
          fileId: fileUploaded.$id,
        };
      }
    }
    const { $id } = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      ID.unique(),
      {
        title: todo,
        description: description,
        status: columnId,
        ...(file && { image: JSON.stringify(file) }),
      }
    );
    set({ newTaskInput: "" });
    set({ newDescription: "" });
    set({ image: null });
    set((state) => {
      const newColumns = new Map(state.board.columns);
      const newTodo: Todo = {
        $id: $id,
        $createdAt: new Date().toISOString(),
        title: todo,
        status: columnId,
        description: description,
        ...(file && { image: file }),
      };
      const column = newColumns.get(columnId);
      if (!column) {
        newColumns.set(columnId, {
          id: columnId,
          todos: [newTodo],
        });
      } else {
        newColumns.get(columnId)?.todos.push(newTodo);
      }
      return { board: { columns: newColumns } };
    });
  },
}));

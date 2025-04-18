
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Block {
  id: string
  type: 'text' | 'heading1' | 'heading2' | 'heading3'
  content: string
}

export interface Note {
  id: string
  title: string
  blocks: Block[]
  createdAt: number
  updatedAt: number
}

interface NotesStore {
  notes: Note[]
  activeNoteId: string | null
  addNote: () => void
  updateNote: (noteId: string, updates: Partial<Note>) => void
  updateBlock: (noteId: string, blockId: string, content: string) => void
  setActiveNote: (noteId: string | null) => void
}

export const useStore = create<NotesStore>()(
  persist(
    (set) => ({
      notes: [],
      activeNoteId: null,
      addNote: () => {
        const newNote: Note = {
          id: crypto.randomUUID(),
          title: 'Untitled',
          blocks: [
            {
              id: crypto.randomUUID(),
              type: 'text',
              content: ''
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id
        }))
      },
      updateNote: (noteId, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          )
        }))
      },
      updateBlock: (noteId, blockId, content) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  blocks: note.blocks.map((block) =>
                    block.id === blockId ? { ...block, content } : block
                  ),
                  updatedAt: Date.now()
                }
              : note
          )
        }))
      },
      setActiveNote: (noteId) => set({ activeNoteId: noteId })
    }),
    {
      name: 'notes-storage'
    }
  )
)
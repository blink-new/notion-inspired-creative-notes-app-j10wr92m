
import { create } from 'zustand'
import { supabase } from './supabase'

export interface Block {
  id: string
  type: 'text' | 'heading1' | 'heading2' | 'heading3'
  content: string
}

export interface Note {
  id: string
  title: string
  blocks: Block[]
  created_at: string
  updated_at: string
}

interface NotesStore {
  notes: Note[]
  activeNoteId: string | null
  isLoading: boolean
  addNote: () => Promise<void>
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>
  updateBlock: (noteId: string, blockId: string, content: string) => Promise<void>
  setActiveNote: (noteId: string | null) => void
  fetchNotes: () => Promise<void>
}

export const useStore = create<NotesStore>((set, get) => ({
  notes: [],
  activeNoteId: null,
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true })
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (notes) {
      set({ notes, isLoading: false })
    }
  },

  addNote: async () => {
    const newNote = {
      title: 'Untitled',
      blocks: [{
        id: crypto.randomUUID(),
        type: 'text',
        content: ''
      }]
    }

    const { data: note } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single()

    if (note) {
      set((state) => ({
        notes: [note, ...state.notes],
        activeNoteId: note.id
      }))
    }
  },

  updateNote: async (noteId, updates) => {
    const { data: note } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single()

    if (note) {
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? note : n
        )
      }))
    }
  },

  updateBlock: async (noteId, blockId, content) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return

    const updatedBlocks = note.blocks.map((block) =>
      block.id === blockId ? { ...block, content } : block
    )

    const { data: updatedNote } = await supabase
      .from('notes')
      .update({ blocks: updatedBlocks })
      .eq('id', noteId)
      .select()
      .single()

    if (updatedNote) {
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? updatedNote : n
        )
      }))
    }
  },

  setActiveNote: (noteId) => set({ activeNoteId: noteId })
}))

// Setup real-time subscription
supabase
  .channel('notes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'notes' 
  }, (payload) => {
    const store = useStore.getState()
    
    if (payload.eventType === 'INSERT') {
      const note = payload.new as Note
      store.fetchNotes()
    }
    
    if (payload.eventType === 'UPDATE') {
      const note = payload.new as Note
      store.fetchNotes()
    }
    
    if (payload.eventType === 'DELETE') {
      const oldNote = payload.old as Note
      store.fetchNotes()
    }
  })
  .subscribe()
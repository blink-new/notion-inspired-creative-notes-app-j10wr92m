
import { create } from 'zustand'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface Block {
  id: string
  type: 'text' | 'heading1' | 'heading2' | 'heading3'
  content: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  blocks: Block[]
  created_at: string
  updated_at: string
}

interface NotesStore {
  notes: Note[]
  activeNoteId: string | null
  isLoading: boolean
  user: User | null
  setUser: (user: User | null) => void
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
  user: null,

  setUser: (user) => set({ user }),

  fetchNotes: async () => {
    const user = get().user
    if (!user) return

    set({ isLoading: true })
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    
    if (notes) {
      set({ notes, isLoading: false })
    } else {
      console.error('Error fetching notes:', error)
      set({ isLoading: false })
    }
  },

  addNote: async () => {
    const user = get().user
    if (!user) return

    const newNote = {
      user_id: user.id,
      title: 'Untitled',
      blocks: [{
        id: crypto.randomUUID(),
        type: 'text' as const,
        content: ''
      }]
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single()

    if (note) {
      set((state) => ({
        notes: [note, ...state.notes],
        activeNoteId: note.id
      }))
    } else {
      console.error('Error creating note:', error)
    }
  },

  updateNote: async (noteId, updates) => {
    const user = get().user
    if (!user) return

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (note) {
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? note : n
        )
      }))
    } else {
      console.error('Error updating note:', error)
    }
  },

  updateBlock: async (noteId, blockId, content) => {
    const user = get().user
    if (!user) return

    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return

    const updatedBlocks = note.blocks.map((block) =>
      block.id === blockId ? { ...block, content } : block
    )

    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update({ blocks: updatedBlocks })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updatedNote) {
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? updatedNote : n
        )
      }))
    } else {
      console.error('Error updating block:', error)
    }
  },

  setActiveNote: (noteId) => set({ activeNoteId: noteId })
}))

// Setup real-time subscription
supabase.auth.onAuthStateChange((event, session) => {
  const store = useStore.getState()
  store.setUser(session?.user ?? null)
  
  if (session?.user) {
    store.fetchNotes()
  } else {
    store.setActiveNote(null)
    useStore.setState({ notes: [] })
  }
})

// Setup real-time subscription for notes
supabase
  .channel('notes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'notes' 
  }, (payload) => {
    const store = useStore.getState()
    const user = store.user
    
    if (!user) return
    
    // Only update if the change is for the current user's notes
    if (payload.new && (payload.new as Note).user_id === user.id) {
      store.fetchNotes()
    }
  })
  .subscribe()
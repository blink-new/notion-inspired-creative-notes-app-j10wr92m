
import { create } from 'zustand'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import { debounce } from 'lodash-es'

export interface Block {
  id: string
  type: 'text' | 'heading1' | 'heading2' | 'heading3'
  content: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
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
  updateNote: (noteId: string, updates: Partial<Note>) => void // Removed Promise
  updateBlock: (noteId: string, blockId: string, content: string) => void // Removed Promise
  setActiveNote: (noteId: string | null) => void
  fetchNotes: () => Promise<void>
}

export const useStore = create<NotesStore>((set, get) => {
  // Debounced save function
  const debouncedSave = debounce(async (noteId: string, updates: Partial<Note>) => {
    const user = get().user
    if (!user) return

    try {
      const { data: note, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          content: updates.blocks ? updates.blocks[0]?.content || '' : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      if (note) {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId ? { ...note, blocks: updates.blocks || n.blocks } : n
          )
        }))
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }, 750) // 750ms debounce delay

  return {
    notes: [],
    activeNoteId: null,
    isLoading: false,
    user: null,

    setUser: (user) => set({ user }),

    fetchNotes: async () => {
      const user = get().user
      if (!user) return

      set({ isLoading: true })
      try {
        const { data: notes, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
        
        if (error) throw error
        
        const processedNotes = notes.map(note => ({
          ...note,
          blocks: note.blocks || [{
            id: crypto.randomUUID(),
            type: 'text' as const,
            content: note.content || ''
          }]
        }))

        set({ notes: processedNotes, isLoading: false })
      } catch (error) {
        console.error('Error fetching notes:', error)
        set({ isLoading: false })
      }
    },

    addNote: async () => {
      const user = get().user
      if (!user) return

      const initialBlock = {
        id: crypto.randomUUID(),
        type: 'text' as const,
        content: ''
      }

      const newNote = {
        user_id: user.id,
        title: 'Untitled',
        content: '',
        blocks: [initialBlock]
      }

      try {
        const { data: note, error } = await supabase
          .from('notes')
          .insert([newNote])
          .select()
          .single()

        if (error) throw error

        if (note) {
          set((state) => ({
            notes: [{ ...note, blocks: [initialBlock] }, ...state.notes],
            activeNoteId: note.id
          }))
        }
      } catch (error) {
        console.error('Error creating note:', error)
      }
    },

    // Optimistic update with debounced save
    updateNote: (noteId, updates) => {
      // Immediately update UI
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? { ...n, ...updates } : n
        )
      }))

      // Debounced save to database
      debouncedSave(noteId, updates)
    },

    // Optimistic update with debounced save
    updateBlock: (noteId, blockId, content) => {
      const note = get().notes.find((n) => n.id === noteId)
      if (!note) return

      const updatedBlocks = note.blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block
      )

      // Immediately update UI
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === noteId ? { ...n, blocks: updatedBlocks } : n
        )
      }))

      // Debounced save to database
      debouncedSave(noteId, { blocks: updatedBlocks })
    },

    setActiveNote: (noteId) => set({ activeNoteId: noteId })
  }
})

// Auth state listener
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

// Real-time subscription
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
    
    if (payload.new && (payload.new as Note).user_id === user.id) {
      store.fetchNotes()
    }
  })
  .subscribe()
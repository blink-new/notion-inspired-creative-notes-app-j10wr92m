
import { PlusIcon, FileTextIcon, Search } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { AuthButton } from './AuthButton'
import { useState } from 'react'

export function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNote, isLoading } = useStore()
  const [search, setSearch] = useState('')

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-64 border-r border-border h-screen bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="font-semibold">Notes</h1>
        <AuthButton />
      </div>
      <div className="p-4 border-b">
        <Button
          onClick={addNote}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          New Note
        </Button>
      </div>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {search ? 'No notes found' : 'No notes yet'}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className={cn(
                  'w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-accent transition-colors',
                  activeNoteId === note.id && 'bg-accent'
                )}
              >
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">
                    {note.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
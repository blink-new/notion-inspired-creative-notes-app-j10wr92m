
import { PlusIcon, FileTextIcon } from '@radix-ui/react-icons'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { ScrollArea } from './ui/scroll-area'

export function Sidebar() {
  const { notes, activeNoteId, addNote, setActiveNote } = useStore()

  return (
    <div className="w-64 border-r border-border h-screen bg-background flex flex-col">
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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={cn(
                'w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-accent transition-colors',
                activeNoteId === note.id && 'bg-accent'
              )}
            >
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate text-sm">
                {note.title || 'Untitled'}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
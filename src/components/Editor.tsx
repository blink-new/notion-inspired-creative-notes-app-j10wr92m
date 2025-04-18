
import { useStore, type Block } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Editor() {
  const { notes, activeNoteId, updateNote, updateBlock } = useStore()
  const activeNote = notes.find((n) => n.id === activeNoteId)

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create a note to start editing
      </div>
    )
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNote(activeNote.id, { title: e.target.value })
  }

  const handleBlockChange = (block: Block, content: string) => {
    updateBlock(activeNote.id, block.id, content)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto p-8">
        <input
          value={activeNote.title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="text-4xl font-bold w-full bg-transparent border-none outline-none mb-8"
        />
        <div className="space-y-4">
          {activeNote.blocks.map((block) => (
            <div key={block.id} className="group relative">
              <textarea
                value={block.content}
                onChange={(e) => handleBlockChange(block, e.target.value)}
                placeholder="Type '/' for commands"
                className={cn(
                  'w-full resize-none bg-transparent border-none outline-none min-h-[100px]',
                  block.type === 'heading1' && 'text-3xl font-bold',
                  block.type === 'heading2' && 'text-2xl font-bold',
                  block.type === 'heading3' && 'text-xl font-bold'
                )}
              />
              <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded border border-border flex items-center justify-center cursor-pointer hover:bg-accent">
                  +
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
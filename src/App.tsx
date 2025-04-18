
import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { useStore } from './lib/store'
import { Toaster } from './components/ui/toaster'

function App() {
  const { fetchNotes } = useStore()

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <Editor />
      <Toaster />
    </div>
  )
}

export default App
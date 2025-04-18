
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Loader2, Github } from 'lucide-react'

export function AuthButton() {
  const [isLoading, setIsLoading] = useState(true)
  const user = useStore((state) => state.user)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      useStore.getState().setUser(session?.user ?? null)
      setIsLoading(false)
    })
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (isLoading) {
    return (
      <Button variant="ghost" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button onClick={handleLogin} variant="ghost" className="gap-2">
        <Github className="h-4 w-4" />
        Sign In
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-sm text-muted-foreground">
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
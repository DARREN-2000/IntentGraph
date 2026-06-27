import { Button } from '@/components/Button'
import { Hexagon } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground dark text-center px-4">
      <Hexagon className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-4xl font-bold tracking-tight mb-2">404 - Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  )
}
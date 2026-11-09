import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

/** What the Play and Reference views say before any spell is in the book. */
export function NoSpellsYet({ onManage }: { onManage: () => void }) {
  return (
    <EmptyState
      iconSlot={<BookOpen />}
      title="No spells in your spell book yet"
      description="Add them from your class's spell list in the Manage view."
      actionSlot={<Button variant="info" content="Go to Manage" onClick={onManage} />}
    />
  )
}

import { leaves } from './book/leaves'
import FlipBook from './components/FlipBook'

export default function App() {
  return (
    <main className="flex h-full items-center justify-center overflow-hidden">
      <FlipBook leaves={leaves} />
    </main>
  )
}

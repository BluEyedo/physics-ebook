import { leaves } from './book/leaves'
import Book from './components/Book'

export default function App() {
  return (
    <main className="flex h-full items-center justify-center overflow-hidden">
      <Book leaves={leaves} />
    </main>
  )
}

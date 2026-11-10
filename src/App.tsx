import DiverScene from './components/scenes/DiverScene'
import EnergyExchangeScene from './components/scenes/EnergyExchangeScene'

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  const base = /^\/physics-ebook(?:\/|$)/.test(path) ? '/physics-ebook' : ''
  const route = path.slice(base.length)
  const page = route === '' || route === '/1' ? '1' : route === '/2' ? '2' : null

  return (
    <main className="@container mx-auto h-svh min-h-64 w-full max-w-[1400px] p-2 sm:p-4">
      {page === '1' && <DiverScene />}
      {page === '2' && <EnergyExchangeScene />}
      {page === null && <p className="text-center">الصفحة غير موجودة</p>}
    </main>
  )
}

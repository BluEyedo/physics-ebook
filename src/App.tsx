import { Caption133, Caption136, Page133, Page136 } from './book/pages'
import { FigurePage } from './book/ui'
import DiverScene from './components/scenes/DiverScene'
import EnergyExchangeScene from './components/scenes/EnergyExchangeScene'

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  const base = /^\/physics-ebook(?:\/|$)/.test(path) ? '/physics-ebook' : ''
  const route = path.slice(base.length)
  const page = route === '' || route === '/1' ? '1' : route === '/2' ? '2' : null

  return (
    <main className="mx-auto w-full max-w-[1400px] p-2 sm:p-4">
      <nav aria-label="صفحات الكتاب" className="mb-3 flex justify-center gap-2">
        {['1', '2'].map((id) => (
          <a
            key={id}
            href={`${base}/${id}`}
            aria-current={id === page ? 'page' : undefined}
            className="rounded-full border border-stone-300 px-4 py-1 text-sm text-stone-700 hover:bg-stone-100 aria-[current=page]:bg-stone-200"
          >
            صفحة {id === '1' ? 4 : 10}
          </a>
        ))}
      </nav>
      {page === null ? (
        <p className="text-center">الصفحة غير موجودة</p>
      ) : (
        <div className="grid h-[max(34rem,calc(100svh-5rem))] grid-cols-2 overflow-hidden rounded-lg border border-stone-200 shadow-sm">
          <article className="@container min-w-0 overflow-hidden">
            {page === '1' ? <Page133 number={3} /> : <Page136 number={9} />}
          </article>
          <div className="@container min-w-0 overflow-hidden border-r border-stone-200">
            {page === '1' ? (
              <FigurePage number={4} caption={<Caption133 />}>
                <DiverScene />
              </FigurePage>
            ) : (
              <FigurePage number={10} caption={<Caption136 />}>
                <EnergyExchangeScene />
              </FigurePage>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

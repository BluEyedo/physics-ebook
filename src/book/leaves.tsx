import DiverScene from '../components/scenes/DiverScene'
import type { Leaf } from '../components/FlipBook'
import ElasticScene from '../components/scenes/ElasticScene'
import EnergyExchangeScene from '../components/scenes/EnergyExchangeScene'
import GravityScene from '../components/scenes/GravityScene'
import PracticeProblems from '../components/scenes/PracticeProblems'
import RestEnergyScene from '../components/scenes/RestEnergyScene'
import ReviewSolutions from '../components/scenes/ReviewSolutions'
import WorkEnergyScene from '../components/scenes/WorkEnergyScene'
import {
  BackCover,
  Caption132,
  Caption133,
  Caption134,
  Caption135,
  Caption136,
  Caption139,
  Caption140,
  CaptionReview,
  CheckPart1,
  CheckPart2,
  Cover,
  Formulas,
  Page132,
  Page133,
  Page134,
  Page135,
  Page136,
  Page139,
  Page140,
  Review51,
  Summary,
} from './pages'
import { FigurePage } from './ui'

/*
 * Right-to-left book. Each spread shows a leaf's back on the RIGHT (the textbook text)
 * and the next leaf's front on the LEFT (that page's interactive figure).
 * Page numbers run in reading order: right page = odd, left page = even.
 * `label` names the spread that a leaf's back opens.
 */
export const leaves: Leaf[] = [
  { front: <Cover />, back: <Page132 number={1} />, label: 'ص 132 · نموذج الشغل – الطاقة' },
  {
    front: (
      <FigurePage number={2} caption={<Caption132 />}>
        <WorkEnergyScene />
      </FigurePage>
    ),
    back: <Page133 number={3} />,
    label: 'ص 133 · الطاقة الحركية',
  },
  {
    front: (
      <FigurePage number={4} caption={<Caption133 />}>
        <DiverScene />
      </FigurePage>
    ),
    back: <Page134 number={5} />,
    label: 'ص 134 · الطاقة المختزنة',
  },
  {
    front: (
      <FigurePage number={6} caption={<Caption134 />}>
        <PracticeProblems />
      </FigurePage>
    ),
    back: <Page135 number={7} />,
    label: 'ص 135 · طاقة الوضع الجاذبية',
  },
  {
    front: (
      <FigurePage number={8} caption={<Caption135 />}>
        <GravityScene />
      </FigurePage>
    ),
    back: <Page136 number={9} />,
    label: 'ص 136 · طاقة الحركة وطاقة الوضع',
  },
  {
    front: (
      <FigurePage number={10} caption={<Caption136 />}>
        <EnergyExchangeScene />
      </FigurePage>
    ),
    back: <Page139 number={11} />,
    label: 'ص 139 · طاقة الوضع المرونية',
  },
  {
    front: (
      <FigurePage number={12} caption={<Caption139 />}>
        <ElasticScene />
      </FigurePage>
    ),
    back: <Page140 number={13} />,
    label: 'ص 140 · الطاقة السكونية',
  },
  {
    front: (
      <FigurePage number={14} caption={<Caption140 />}>
        <RestEnergyScene />
      </FigurePage>
    ),
    back: <Review51 number={15} />,
    label: 'مراجعة 5-1',
  },
  {
    front: (
      <FigurePage number={16} caption={<CaptionReview />}>
        <ReviewSolutions />
      </FigurePage>
    ),
    back: <CheckPart1 number={17} />,
    label: 'راجع فهمك',
  },
  { front: <CheckPart2 number={18} />, back: <Summary number={19} />, label: 'الملخّص والقوانين' },
  { front: <Formulas number={20} />, back: <BackCover /> },
]

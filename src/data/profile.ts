export const profile = {
  name: ['Shreyas', 'Peddireddy'],
  email: 'shreypeddi9265@gmail.com',
  github: 'https://github.com/Shreyas9265',
  linkedin: 'https://www.linkedin.com/in/peddireddy-shreyas-p/',
  availability: '15–20 hrs/week',
};

const gh = (repo: string) => `https://github.com/Shreyas9265/${repo}`;

export type Chapter = 'Experience' | 'Education' | 'Projects';

export type Item = {
  when: string;
  kind: string;
  title: string;
  where?: string;
  text?: string;
  points?: string[];
  chips?: string[];
  /** Live app, if deployed. Billboards open this first. */
  live?: string;
  /** Source code. */
  code?: string;
  /** Where a click on the billboard goes when there's no live app or code. */
  href?: string;
  hud: string;
};

/** One stretch of road. Holds one item, or two (a billboard on each side). */
export type Slot = { chapter: Chapter; items: Item[] };

export const chapters: { name: Chapter; blurb: string }[] = [
  { name: 'Experience', blurb: 'Where I have worked, oldest first.' },
  { name: 'Education', blurb: 'Degrees and certification.' },
  { name: 'Projects', blurb: 'Click any billboard to open the live app or the code.' },
];

const experience: Item[] = [
  { when: 'Jan 2023 – Dec 2023', kind: 'Work', title: 'Software Engineer Associate', where: 'PwC India', hud: 'PwC India', href: profile.linkedin,
    text: 'Software engineering on a client business application at PwC India.',
    points: [
      'Resolved user-reported defects across 8 modules of a client business application.',
      'Joined daily stand-ups and peer code reviews in Git.',
      'Wrote clear how-to documentation for the team and client.',
    ],
    chips: ['Defect fixing', 'Git', 'Code review', 'Documentation'] },
  { when: 'Jul 2025 – Jan 2026', kind: 'Work', title: 'Research Assistant', where: 'University at Buffalo', hud: 'Research, UB', href: profile.linkedin,
    text: 'Research support at the University at Buffalo, focused on making review work faster and more reliable.',
    points: ['Introduced repeatable automated quality checks that cut manual review time by about 45%.'],
    chips: ['Automation', 'Quality checks'] },
  { when: 'Jan 2026 – May 2026', kind: 'Work · Contract', title: 'AI Engineer', where: 'Micro1 Inc. · Remote', hud: 'Micro1', href: profile.linkedin,
    text: 'Contract AI engineering: reviewing AI-generated output for correctness before it shipped.',
    points: ['Wrote 50+ evaluation checklists used to review AI-generated output for correctness before release.'],
    chips: ['AI evaluation', 'Quality review'] },
  { when: 'Jun 2026 – Present', kind: 'Work · Current', title: 'Data Scientist', where: 'Spectra Tekshapers LLC · Remote', hud: 'Spectra Tekshapers', href: profile.linkedin,
    text: 'Data science for business stakeholders, from request to finished result.',
    points: [
      'Turn requests from non-technical stakeholders into finished results, with clear written updates.',
      'Validate 100K+ row datasets that feed downstream reports, catching and fixing errors before release.',
    ],
    chips: ['Data validation', 'Reporting', 'Stakeholder communication'] },
];

const education: Item[] = [
  { when: 'Graduated May 2023', kind: 'Education', title: 'B.Tech, Computer Science and Engineering', where: 'Amrita Vishwa Vidyapeetham', hud: 'B.Tech, Amrita', href: profile.linkedin,
    text: 'Undergraduate degree in computer science and engineering.' },
  { when: 'Graduated May 2025', kind: 'Education', title: 'M.S. Engineering Science (Data Science)', where: 'University at Buffalo, SUNY', hud: 'M.S., Buffalo', href: profile.linkedin,
    text: 'Graduate degree in engineering science with a data science focus.',
    points: ['Data science foundations that now shape how I design dashboards and data-heavy UI.'] },
  { when: '2025', kind: 'Certification', title: 'AWS Certified Data Engineer – Associate', where: 'Amazon Web Services', hud: 'AWS certification', href: profile.linkedin,
    text: 'Professional certification in building data pipelines and data stores on AWS.' },
];

export const projects: Item[] = [
  { when: 'Next.js · React 19', kind: 'Frontend', title: 'Custom GPT Assistant', hud: 'Custom GPT Assistant',
    live: 'https://my-gpt-nine-delta.vercel.app', code: gh('Custom-GPT-Assistant'),
    text: 'Responsive AI chat app with streaming responses, Markdown rendering and an accessible shadcn/ui layout.',
    points: [
      'Designed and shipped a responsive chat interface with Next.js 15, React 19, TypeScript and Tailwind CSS v4, deployed to production on Vercel.',
      'Built the layout from accessible Radix UI / shadcn/ui components: collapsible sidebar, thread list, tooltips, breadcrumbs and a mobile slide-out sheet driven by a custom useMobile hook.',
      'Connected the UI to a typed Next.js API route that streams model responses token by token, with Markdown rendering for formatted answers.',
    ],
    chips: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind v4', 'shadcn/ui', 'Vercel'] },
  { when: 'React · Vite', kind: 'Frontend', title: 'FitStrength Pro', hud: 'FitStrength Pro', live: 'https://fitstrength-pro.vercel.app', code: gh('Fitness-Pro-Website---Shreyas'),
    text: 'Fitness and workout web app designed in Figma Make and built with React, TypeScript and Tailwind, with 3D product views.',
    chips: ['React', 'TypeScript', 'Tailwind'] },
  { when: 'React · FastAPI', kind: 'Full stack', title: 'WeatherIQ dashboard', hud: 'WeatherIQ', code: gh('weather-trend-forecasting-dashboard'),
    text: '9-screen React Router dashboard with 13 reusable components and a shared city filter, on a FastAPI forecasting backend.',
    points: [
      'Designed and built a 9-screen dashboard with React Router (dataset, cleaning, exploration, forecasting, maps, insights) in a fixed-sidebar responsive layout, with a city filter shared across screens.',
      'Created a reusable set of 13 components (MetricCard, ChartCard, DataTable, Badge, Header, Sidebar, loading, empty and error states) so every page stays visually consistent.',
      'Wrote useApi / useFetch hooks and an Axios service layer to consume a FastAPI REST backend, handling loading, errors and stale responses on each screen.',
    ],
    chips: ['React', 'Vite', 'Tailwind', 'Recharts', 'Axios', 'FastAPI'] },
  { when: 'React · Spring Boot', kind: 'Full stack', title: 'TaskForge', hud: 'TaskForge', code: gh('TaskForge-Java-'),
    text: 'One JWT-secured Spring Boot API used by a React web app, a React Native app and a Kotlin Android app.',
    chips: ['React', 'React Native', 'Spring Boot'] },
  { when: 'Python · SQLite', kind: 'Full stack', title: 'Baseball Ops Intelligence', hud: 'Baseball Ops', live: 'https://baseball-ops.vercel.app', code: gh('baseball-ops-intelligence'),
    text: 'MLB analytics platform with player data, scouting reports, predictive models and recommendations.',
    chips: ['Python', 'SQLite', 'Docker'] },
  { when: 'React · FastAPI', kind: 'Full stack', title: 'Subscription Expense Guard', hud: 'Expense Guard', live: 'https://subscription-expense-guard.vercel.app', code: gh('Subscription-Expense-Guard'),
    text: 'Upload a bank statement CSV to find every subscription, forecast upcoming charges and catch price hikes and duplicate charges.',
    points: [
      'Built a React + TypeScript + Tailwind dashboard with Recharts: recurring-cost KPIs, a 30-day charge forecast, alerts, spending by category and sortable tables.',
      'Designed a stateless POST /analyze endpoint so uploads work on serverless instances that do not share memory.',
      'FastAPI backend detects monthly and weekly cadences, price hikes over 25% and same-day duplicates; covered by pytest and checked by ruff and black in CI.',
    ],
    chips: ['React', 'TypeScript', 'Recharts', 'FastAPI', 'SQLAlchemy'] },
  { when: 'Python · ML', kind: 'ML', title: 'Telematics UBI', hud: 'Telematics UBI', live: 'https://telematics-ubi-api.vercel.app/docs', code: gh('Telematics-UBI'),
    text: 'Driver dashboard and API that scores driving risk and prices usage-based insurance.',
    chips: ['Python', 'scikit-learn'] },
  { when: 'Python · Data eng', kind: 'Data', title: 'Ghost Scenarios', hud: 'Ghost Scenarios', code: gh('ghost-scenarios-crashes-data-engineer-project'),
    text: 'Mines rare, high-risk driving scenarios from 2019–2022 US federal crash data.',
    chips: ['Python', 'pandas'] },
  { when: 'AWS · ML', kind: 'ML', title: 'NYC Taxi Demand Forecasting', hud: 'NYC Taxi', code: gh('SP25-Taxi-Demand-Forecasting'),
    text: 'Zone-level demand predictions on an AWS Lambda, Glue and S3 pipeline.',
    chips: ['AWS', 'LightGBM'] },
  { when: 'Python · ML', kind: 'ML', title: 'Citi Bike Demand Prediction', hud: 'Citi Bike', code: gh('CitiBike-Demand-Prediction_SPRING25_BIKE'),
    text: 'End-to-end pipeline predicting NYC bike pickups from historical trip data.',
    chips: ['LightGBM', 'XGBoost'] },
  { when: 'TensorFlow · OpenCV', kind: 'ML', title: 'Stress Detection from Facial Signals', hud: 'Stress Detection', code: gh('Cognitive-Stress-Identification-via-Facial-Signals-main'),
    text: 'Real-time stress assessment combining emotion recognition and facial landmark analysis.',
    chips: ['TensorFlow', 'OpenCV'] },
  { when: 'PHP · MySQL', kind: 'Full stack', title: 'E-Commerce Web App', hud: 'E-Commerce', code: gh('E-Commerce'),
    text: 'Sign-up, login, browse and cart flows, plus an admin area for products.',
    points: ['Built multi-step customer flows (sign up, log in, browse, cart) and an admin area for managing products.'],
    chips: ['PHP', 'MySQL', 'HTML', 'CSS'] },
];

const pairs = <T,>(list: T[]) => Array.from({ length: Math.ceil(list.length / 2) }, (_, i) => list.slice(i * 2, i * 2 + 2));

export const slots: Slot[] = [
  ...experience.map((it) => ({ chapter: 'Experience' as const, items: [it] })),
  ...education.map((it) => ({ chapter: 'Education' as const, items: [it] })),
  ...pairs(projects).map((items) => ({ chapter: 'Projects' as const, items })),
];

/** Billboard side: single items alternate left/right; pairs put one on each side. */
export const sideOf = (slotIndex: number, itemIndex: number, count: number): 'l' | 'r' =>
  count === 2 ? (itemIndex === 0 ? 'l' : 'r') : slotIndex % 2 === 0 ? 'l' : 'r';

export const clickTarget = (it: Item) => it.live ?? it.code ?? it.href ?? profile.github;

export const skills = [
  { group: 'Frontend', items: ['React', 'TypeScript', 'Next.js', 'JavaScript ES6+', 'Tailwind CSS', 'HTML5', 'CSS3', 'React Router', 'Vite'] },
  { group: 'UI & motion', items: ['Responsive design', 'Component libraries', 'Radix UI', 'shadcn/ui', 'Three.js', 'React Three Fiber', 'GSAP', 'Framer Motion', 'Recharts'] },
  { group: 'APIs & tools', items: ['REST (Axios, fetch)', 'Custom hooks', 'FastAPI', 'Node.js', 'SQL', 'Git', 'Vercel', 'ESLint'] },
  { group: 'AI-assisted dev', items: ['Prompting for UI', 'Task breakdown', 'Reviewing AI output', 'OpenAI API', 'Gemini', 'Vercel AI SDK'] },
];

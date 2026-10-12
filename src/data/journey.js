// Finds every picture inside src/data/Images/ so you can refer to them by file name only.
const files = import.meta.glob('./Images/**/*', { eager: true, import: 'default' });
const img = (name) => files[`./Images/${name}`] ?? name;

/*
  HOW TO ADD A JOURNEY ENTRY: copy one block { ... }, paste it below, change the values.
  Entries go left to right in the order you write them.

  type         'card' = photo card on the TOP row  |  'dot' = circle on the BOTTOM row
               (optional: if you leave it out, entries alternate  card, dot, card, dot ...)
  title        the title
  description  small text. In the popup the full text is shown. Type \n for a new paragraph.
               (on a 'dot' entry the first paragraph is shown under the circle)
  date         'YYYY-MM-DD' or 'YYYY-MM' (example '2024-03') or your own text like 'Summer 2023'.
               Always set a date, or delete the whole date line to show no date.
  image        optional photo for the 'card'. If empty, the first of "images" is used.
  images       all pictures for the popup. They swap automatically every few seconds.
               Example: [img('journey-1.jpg'), img('journey-2.jpg')]
  layout       where the pictures sit in the popup: 'left' | 'right' | 'top' | 'bottom'
  color        the color of this entry (circle, glow, line, popup background)
*/

export const journey = [
  {
    title: 'Started my journey',
    description: 'Where it all began. Write a few lines about this moment.\nA second paragraph is shown in the popup.',
    date: '2011',
    image: img('Journeys/Startofjourney.jpg'),
    images: [], // e.g. [img('journey-1.jpg'), img('journey-2.jpg')]
    layout: 'right',
    color: '#ffbb00',
  },
  {
    title: 'Learned Blender',
    description: 'First steps into 3D modeling and animation.',
    date: '2014',
    images: [],
    layout: 'left',
    color: '#c05b09',
  },
  {
    title: 'Learned Animation',
    description: 'Another step. Keep it short here, you can write more in the popup.',
    date: '2015',
    image: img('Journeys/animationJourney.jpg'),
    images: [],
    layout: 'top',
    color: '#2b98f1',
  },
  {
    title: 'Learned Roblox Studio',
    description: 'Decided to learn Roblox Studio and started building games.',
    date: '2019',
    images: [],
    layout: 'top',
    color: '#279ceb',
  },
  {
    title: 'Learned Drawing',
    description: 'Putting everything together.',
    date: '2020',
    image: img('Journeys/Drawing.jpeg'),
    images: [],
    layout: 'bottom',
    color: '#bf34f7',
  },
  {
    title: 'Learned Alight Motion for Motion Graphic/Animation',
    description: 'Started learning Alight Motion for creating motion graphics and animations.',
    date: '2021',
    image: '',
    images: [],
    layout: 'left',
    color: '#26d19e',
  },
  {
    title: 'Learned Graphic Design',
    description: 'Started learning graphic design and creating digital art.',
    date: '2021',
    image: img('Journeys/Design1.png'),
    images: [],
    layout: 'left',
    color: '#ffc62b',
  },
  {
    title: 'Learned Web Development',
    description: 'Started learning web development and creating websites.',
    date: '2022',
    image: '',
    images: [],
    layout: 'right',
    color: '#ff6434',
  },
  {
    title: 'What is next',
    description: 'The journey keeps going.',
    date: '2026-10',
    images: [],
    layout: 'right',
    color: '#a3195b',
  },
];

// if an entry has no card photo, use its first popup picture
journey.forEach((p) => {
  if (!p.image && p.images && p.images.length) p.image = p.images[0];
});
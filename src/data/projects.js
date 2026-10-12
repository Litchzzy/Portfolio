// Finds every picture inside src/data/Images/ so you can refer to them by file name only.
const files = import.meta.glob('./Images/**/*', { eager: true, import: 'default' });
const img = (name) => files[`./Images/${name}`] ?? name;

/*
  HOW TO ADD A PROJECT: copy one block { ... }, paste it below, and change the values.

  title        the headline (shown on the card and as the big title in the popup)
  description  the text. To start a new paragraph, type \n inside the quotes.
  date         'YYYY-MM-DD' (example '2026-10-11'). Leave '' to show today's date.
               You can also type your own text, like 'Summer 2026'.
  image        optional small picture for the card. If empty, the first of "images" is used.
  images       all pictures for the popup. They swap automatically every few seconds.
               Example: [img('shop-1.jpg'), img('shop-2.jpg'), img('shop-3.jpg')]
  layout       where the pictures sit in the popup: 'left' | 'right' | 'top' | 'bottom'
  color        the background color of the popup for this project (any hex color)
  tags         small labels
  link         project link (GitHub, live site...). Leave '' for none.
*/

export const projects = [
  {
    title: 'Project 365 (2026)',
    description:
      'Challenging project, Design Everyday until 365 Days.\nA second paragraph goes here. Use \\n to start a new paragraph.',
    date: '2026-10-11',
    image: img('Projects/Day25.jpg'),
    images: [], // e.g. [img('project-one-1.jpg'), img('project-one-2.jpg')]
    layout: 'right',
    color: '#0f4c81',
    tags: ['My Project'],
    link: '',
  },
  {
    title: 'Posters Design Project',
    description: 'Posters i made for my school project and my personal project.',
    date: '2026-08-15',
    image: img('Projects/Sanya.jpg'),
    images: [],
    layout: 'left',
    color: '#b5451b',
    tags: ['My Project', 'School Project'],
    link: '',
  },
  {
    title: 'Drawing Project',
    description: 'My recent drawing project.',
    date: '',
    image: img('Projects/Drawing4.jpeg'),
    images: [],
    layout: 'left',
    color: '#7b2d8b',
    tags: ['My Project', 'School Project'],
    link: '',
  },
  {
    title: 'Cinematic Animation Project',
    description: 'Blender Cinematic Animation Project.',
    date: '2026-09-02',
    image: img('Projects/Cinematic1.jpeg'),
    images: [],
    layout: 'top',
    color: '#0e7c66',
    tags: ['My Project'],
    link: '',
  },
  {
    title: 'Card Design Project',
    description: 'Card School Project',
    date: '2026-07-01',
    image: img('Projects/CardFront.png'),
    images: [],
    layout: 'right',
    color: '#a3195b',
    tags: ['My Project', 'School Project'],
    link: '',
  },
  {
    title: 'Photography Project',
    description: 'A collection of my favorite photographs.',
    date: '2026-06-20',
    image: img('Projects/Rangers.png'),
    images: [],
    layout: 'left',
    color: '#ffbb00',
    tags: ['My Project', 'School Project', 'Competition Project'],
    link: '',
  },
];

// if a project has no card picture, use its first popup picture
projects.forEach((p) => {
  if (!p.image && p.images && p.images.length) p.image = p.images[0];
});
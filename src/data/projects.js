// Finds every picture inside src/data/Images/ so you can refer to them by file name only.
const files = import.meta.glob('./Images/**/*', { eager: true, import: 'default' });
const img = (name) => files[`./Images/${name}`] ?? name;
const getProject365Images = () => {
  return Object.keys(files)
    .filter((path) => {
      return /^\.\/Images\/Projects\/Project365\/Day\s+\d+\.(jpg|jpeg|png|webp)$/i.test(path);
    })
    .sort((a, b) => {
      const dayA = Number(a.match(/Day\s+(\d+)/i)[1]);
      const dayB = Number(b.match(/Day\s+(\d+)/i)[1]);

      return dayA - dayB;
    })
    .map((path) => files[path]);
};



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
      'A personal challenge to create one design every day for 365 days, pushing my creativity and consistency while exploring different styles and ideas. I managed to complete 79 days before device problems forced me to stop. Although I never reached the final day, the project remains a meaningful milestone in my creative journey and a reminder of how much I can achieve through consistent practice.',
    date: '2026-10-11',
    image: img('Projects/Day25.jpg'),
    images: getProject365Images(), // e.g. [img('project-one-1.jpg'), img('project-one-2.jpg')]
    layout: 'right',
    color: 'auto',
    tags: ['My Project'],
    link: '',
  },
  {
    title: 'Posters Design Project',
    description: 'A collection of poster designs created for school assignments and personal projects, exploring typography, color, composition, and visual storytelling to communicate ideas through compelling visuals.',
    date: '2026-08-15',
    image: img('Projects/Sanya.jpg'),
    images: [],
    layout: 'left',
    color: 'auto',
    tags: ['My Project', 'School Project', 'Competition Project'],
    link: '',
  },
  {
    title: 'Drawing Project',
    description: 'A collection of my drawings showcasing my creativity, artistic exploration, and ongoing development of my drawing skills through different subjects, styles, and techniques.',
    date: '',
    image: img('Projects/Drawing4.jpeg'),
    images: [img('Projects/Drawing1.jpeg'), img('Projects/Drawing2.jpeg'), img('Projects/Drawing3.jpeg'), img('Projects/Drawing4.jpeg')],
    layout: 'left',
    color: 'auto',
    tags: ['My Project', 'School Project'],
    link: '',
  },
  {
    title: 'Cinematic Animation Project',
    description: 'A Blender cinematic animation project focused on creating immersive scenes through 3D modeling, lighting, camera composition, and animation. This project allowed me to explore visual storytelling and bring creative ideas to life through cinematic visuals.',
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
    description: 'A card design project created for a school assignment, focusing on visual composition, typography, color harmony, and layout to produce a cohesive and visually appealing design.',
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
    description: 'A collection of photographs capturing interesting moments, subjects, and environments. Through this project, I explored composition, lighting, and perspective to create visually engaging images and develop my eye for detail.',
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

  // color: 'auto' (or no color at all) = taken from the picture automatically
  p.autoColor = !p.color || p.color === 'auto';
  if (p.autoColor) p.color = '';
});
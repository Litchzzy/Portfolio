// Finds every picture inside src/data/Images/ so you can refer to them by file name only.
const files = import.meta.glob('./Images/**/*', { eager: true, import: 'default' });
const img = (name) => files[`./Images/${name}`] ?? name;

/* TEMPLATE
  {
    title:
    shape:
    description:
    date:
    image:
    images:
    layout:
    color:
  },
*/

export const journey = [
  {
    title: 'Started my journey',
    shape: 'card',
    description: 'Every journey starts somewhere. This was the beginning of my curiosity about the digital world, opening the door to new interests, creative ideas, and skills that would shape what I do today.',
    date: '2011',
    image: img('Journeys/Startofjourney.jpg'),
    images: [], // e.g. [img('journey-1.jpg'), img('journey-2.jpg')]
    layout: 'right',
    color: '#ffbb00',
  },
  {
    title: 'Learned Blender',
    shape: 'dot',
    description: 'I began exploring Blender and discovered the world of 3D modeling. It introduced me to the process of turning ideas into three-dimensional objects and sparked my interest in digital creation.',
    date: '2014',
    images: [],
    layout: 'left',
    color: '#c05b09',
  },
  {
    title: 'Learned Animation',
    shape: 'dot',
    description: 'I started learning animation, experimenting with movement, timing, and visual storytelling. It taught me how small details can bring static ideas to life and make creative work feel more dynamic.',
    date: '2015',
    image: img('Journeys/animationJourney.jpg'),
    images: [],
    layout: 'top',
    color: '#2b98f1',
  },
  {
    title: 'Learned Roblox Studio',
    shape: 'dot',
    description: 'Roblox Studio introduced me to game development. I started exploring how games are built, experimenting with environments and gameplay, and gradually discovering the possibilities of turning ideas into interactive experiences.',
    date: '2019',
    images: [],
    layout: 'top',
    color: '#279ceb',
  },
  {
    title: 'Learned Drawing',
    shape: 'card',
    description: 'Drawing became another way to express my creativity. I began exploring shapes, composition, and visual details, developing a stronger appreciation for the artistic side of design.',
    date: '2020',
    image: img('Journeys/Drawing.jpeg'),
    images: [],
    layout: 'bottom',
    color: '#bf34f7',
  },
  {
    title: 'Built my Social Media Accounts',
    shape: 'card',
    description: 'Started building my social media presence as a Content Creator and Digital Artist.',
    date: '2020',
    image: img('Journeys/SocialMedia.PNG'),
    images: [],
    layout: 'right',
    color: '#ffbb00',
  },
  {
    title: 'Learned Alight Motion for Motion Graphic/Animation',
    shape: 'dot',
    description: 'Using Alight Motion, I began experimenting with motion graphics and animation. I explored transitions, keyframes, effects, and timing, learning how movement can communicate ideas and create more engaging visuals.',
    date: '2021',
    image: '',
    images: [],
    layout: 'left',
    color: '#26d19e',
  },
  {
    title: 'Learned Graphic Design',
    shape: 'card',
    description: 'I started exploring graphic design, learning how typography, color, composition, and visual hierarchy work together. This helped me develop my visual style and create designs that communicate ideas more effectively.',
    date: '2021',
    image: img('Journeys/Design1.png'),
    images: [],
    layout: 'left',
    color: '#ffc62b',
  },
  {
    title: 'Learned Web Development & UI/UX Design',
    shape: 'dot',
    description: 'I began learning web development and discovered how design and code could work together. Building websites allowed me to transform visual concepts into interactive experiences while developing my skills in programming, layout, and user experience.',
    date: '2022',
    image: '',
    images: [],
    layout: 'right',
    color: '#ff6434',
  },
  {
    title: 'Learned 3D Modeling & Animation more',
    shape: 'dot',
    description: 'Continued exploring 3D modeling and animation techniques.',
    date: '2023',
    image: '',
    images: [],
    layout: 'left',
    color: '#26d19e',
  },
  {
    title: 'Expanded my skills in Game Development',
    shape: 'dot',
    description: 'Continued developing my skills in game development.',
    date: '2023',
    image: '',
    images: [],
    layout: 'left',
    color: '#ff6434',
  },
  {
    title: 'Created my first Roblox game & Publish it',
    shape: 'card',
    description: 'Built and published my first game on Roblox and it blow up 4k visits of people.',
    date: '2023-12-25',
    image: img('Journeys/satetusukJourney.PNG'),
    images: [],
    layout: 'left',
    color: '#ff6434',
  },
  {
    title: 'Trying to build my first Portfolio Website',
    shape: 'card',
    description: 'I started building my first portfolio website to showcase my projects and skills. It was a learning experience that allowed me to apply my knowledge of web development, design, and user experience to create a platform that represents my work and creative journey. but I failed to build it because I was too lazy to learn and build it.',
    date: '2025-01-09',
    image: img('Journeys/firstPortfolio.jpeg'),
    images: [],
    layout: 'right',
    color: '#26d19e',
  },
  {
    title: 'A little proud of myself',
    shape: 'card',
    description: 'I\'m proud of the progress I\'ve made and the skills I\'ve developed. Each step of my journey has taught me valuable lessons, and I look forward to continuing to grow and explore new creative opportunities.',
    date: '2025-10-26',
    image: img('Journeys/littleProud.webp'),
    images: [],
    layout: 'left',
    color: '#26d19e',
  },
  {
    title: 'Learned Deeper in Adobe Photoshop, Illustrator, After Effects, Blender, and Figma',
    shape: 'dot',
    description: 'I delved deeper into Adobe Photoshop, Illustrator, After Effects, Blender, and Figma, honing my skills in graphic design, animation, 3D modeling, and UI/UX design. This allowed me to create more polished and professional work across various mediums.',
    date: '2026',
    image:  '',
    images: [],
    layout: 'left',
    color: '#26d19e',
  },
  {
    title: 'Built my first Portfolio Website in GitHub',
    shape: 'dot',
    description: 'I successfully built and deployed my first portfolio website using GitHub Pages, showcasing my projects and skills in a professional manner. and this is the website you are currently visiting right now.',
    date: '2026-08',
    image: '',
    images: [],
    layout: 'right',
    color: '#26d19e',
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
// Finds every picture inside src/data/Images/ so you can refer to them by file name only.
const files = import.meta.glob('./Images/*', { eager: true, import: 'default' });
const img = (name) => files[`./Images/${name}`] ?? name;

/*
  Everything in the About section is edited HERE. Change the text between the quotes.
*/
export const about = {
  // your photo (put the file in src/data/Images/)
  photo: img('Aboutme.png'),
  photoSide: 'left', // 'left' or 'right'

  name: 'Locth',

  // these words are typed out one after another: "I'm a ..."
  roles: ['Graphic Designer', 'Game Developer', 'Web Developer', 'Creative Coder', '3D Enthusiast', 'Problem Solver', 'Animator', 'UI/UX Designer', 'Digital Artist', 'Machine Learning Enthusiast', 'Motion Graphics Designer', 'Photographer', 'Video Editor', 'Blender Artist', 'Roblox Developer', 'LUA Programmer', 'Spline Designer', 'Figma Expert', 'VS Code User', 'Python Programmer', 'JavaScript Developer', 'C# Programmer', '3D Modeler', 'Digital Creator'],

  // type \n to start a new paragraph
  bio:
    'I\'m a 17y.o, love for Design and Development.\n',

  // the green "available" badge on your photo (set available: false to hide it)
  available: true,
  availableText: 'Available for work',

  // numbers that count up when the section appears
  stats: [
    { value: 16, suffix: '+', label: 'Years of Computer Experience' },
    { value: 9, suffix: '', label: 'Years of Deep Learning' },
    { value: 10, suffix: '+', label: 'Projects built' },
    { value: 100, suffix: '%', label: 'Passion' },
  ],

  // bars that fill up (level = 0 to 100)
  skills: [
    { name: 'Adobe Photoshop', level: 98 },
    { name: 'Adobe Illustrator', level: 90 },
    { name: 'Adobe After Effects', level: 75 },
    { name: 'Roblox Studio', level: 95 },
  ],

  // small pills with an emoji
  facts: [
    { icon: '📍', text: 'Malang' },
    { icon: '🎮', text: 'Loves Game Design & Game Building' },
    { icon: '🍵', text: 'Powered by Tea' },
  ],

  // the moving strip of tools under the card
  tools: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe After Effects', 'Blender', 'HTML & CSS', 'Three.js', 'Roblox Studio', 'LUA','Spline', 'GitHub', 'Figma', 'VS Code', 'Python', 'JavaScript', 'C#', 'Photography', 'Animation', '3D Modeling', 'Video Editing', 'Graphic Design', 'UI/UX Design', 'Game Development', 'Web Development', 'Creative Coding', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'Digital Art', 'Motion Graphics'],

  // your CV file: put it in the "public" folder and write its name, e.g. '/cv.pdf'. Leave '' to hide the button.
  cv: '',
};
// Everything about the loading screen is edited HERE. Change the text between the quotes.
export const loader = {
  enabled: true,         // false = no loading screen at all
  oncePerSession: false, // true = only shows the first time a visitor opens the site (until they close the tab)
  duration: 3,           // seconds the white bar takes to fill up
  accent: '#ffae00',
  scale: 0.65,     // the red color (bars, diamond, stripes, the LOCTH flash)

  title: 'LOCTH',        // the big text (it never changes now)

  // the small text under the white bar. It changes as the bar fills, spread evenly.
  // {percent} turns into the live number (00 to 100)
  subtitles: [
    'LOADING {percent}%',
    'LOADING ASSETS {percent}%',
    'BUILDING INTERFACE {percent}%',
    'WELCOME {percent}%',
  ],

  // small texts in the corners (they type themselves out). Longer text = longer typing.
  topLeftText:
    'Portfolio of Locth // designer and developer turning curiosity into creative work. Loading graphic design modules, 3D animation assets, game projects and interactive web experiences. Initializing interface... please wait while the journey begins.',
  topRightText: 'Always building, always learning.', // keep this one short, it has a small box

  typeSpeedLeft: 12,  // milliseconds per letter. Smaller = faster
  typeSpeedRight: 45, // slower than the left one
};
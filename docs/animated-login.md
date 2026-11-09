# Video-reference robot login

The latest user instruction replaces the cat with the reference video's white robot. `robot.css` renders its cyan eyes, antenna, shell, and body, with blinking, floating, focus reactions, and a 550ms password turn-away. Both the standalone page and app authentication screens use the robot. The original photograph assets remain unused by the login page.

Open `public/animated-login.html` directly in a browser, or visit `/animated-login.html` on the Next.js server. Keep the adjacent CSS, JS, and `auth-cat.jpg` together when copying the standalone page.

The standalone HTML/CSS/JavaScript implementation validates fields and demonstrates success without sending or storing credentials. The existing `/register` and `/login` app routes share its styling and photograph, while retaining Firebase authentication and the existing demo workflow.

This implements the requested single-photo option: breathing and floating, curious zoom and tilt, a privacy blur, a subdued error reaction, and a playful celebration with purple/gold confetti. Photo transforms and filters transition over 400ms. It does not synthesize facial expressions. Reduced-motion preferences disable animations and transitions.

Real photograph: [Close-Up Portrait of a Cat with Green Eyes, Pexels](https://www.pexels.com/photo/close-up-portrait-of-a-cat-with-green-eyes-35657005/). Downloaded locally as `public/auth-cat.jpg` so it works offline. [Pexels license](https://www.pexels.com/license/).

Checks: `node scripts/check-photo-login.mjs` covers image loading, all focus moods, invalid submissions, password visibility, successful demo submissions and confetti, switching tabs by keyboard, layout overflow at 320/390/1440px, reduced motion, and browser errors. TypeScript: `node node_modules/typescript/bin/tsc --noEmit`.

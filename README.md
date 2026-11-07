# Tiger Motors Lean Education Center

**Live site: [tigermotorslean.com](https://tigermotorslean.com)**

A digital learning environment for Auburn University's 4,000 sq ft Integrated Manufacturing Facility, a lab that simulates high-volume automotive production. Learners can tour the lab, work through Lean modules and earn a certificate of completion without setting foot on campus.

Supported by the NSF IUSE: EDU program (DUE 2417082) and used by industry and academic partners such as Honda, GE Aerospace and Brose.

## Features

- **360° lab tours** of the facility and of students running the production system
- **Learning modules** organized around the Lean House, with videos, readings and podcasts that open in an in-page viewer
- **Interactive pieces** in each module: sort mass production vs. lean practices, pull the andon cord on a defect, 5S a messy workbench, and run push vs. pull lines side by side
- **End-of-module quizzes** that unlock once every resource in the module is done
- **Free learner accounts** (email magic link) with progress tracking and a **certificate of completion**
- **Four languages:** English, Spanish, German and Italian
- **Installable app** (PWA) on phones and computers
- Past TA spotlights, testimonials, and a feedback form

## Built with

Plain HTML, CSS and JavaScript (no build step), hosted on GitHub Pages. [Supabase](https://supabase.com) provides accounts, progress storage and edge functions for form submissions.

| Path | What it holds |
| --- | --- |
| `index.html`, `modules.html`, `certificate.html` | Home, learning modules, certificate |
| `modules-data.js` | Module content and quiz questions |
| `auth.js` | Accounts, progress tracking, certificate |
| `quiz.js`, `modules-play.js`, `viewer.js` | Quizzes, interactive pieces, in-page media viewer |
| `i18n.js`, `i18n-dict.js` | Language switcher and translations |
| `supabase/functions/` | Edge functions for form submissions |
| `tools/` | Asset scripts (thumbnails, image compression) |

## Run locally

Serve the folder with any static server, for example:

```bash
python3 -m http.server 8767
```

Then open http://localhost:8767.

---

Developed at Auburn University, Department of Industrial & Systems Engineering.

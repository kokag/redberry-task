# Kino XII

A cinema booking app built for the **Redberry Bootcamp XII** assignment. Users can browse movies and sessions, filter sessions, pick seats, book tickets and manage their profile.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Framework:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **UI library:** [Quasar 2](https://quasar.dev/) (Quasar CLI with Vite)
- **State management:** [Pinia](https://pinia.vuejs.org/)
- **Routing:** [Vue Router](https://router.vuejs.org/) (history mode)
- **HTTP client:** [axios](https://axios-http.com/)
- **Styles:** SCSS
- **Linting / formatting:** oxlint, oxfmt
- **Deployment:** Netlify

## Features

- Home page with now playing and coming soon movies, plus recently viewed movies
- Sessions page with filters and pagination
- Movie page with its sessions grouped by venue
- Booking flow: seat map, checkout and confirmation
- Login and registration modals
- Profile page with personal info and booked tickets
- Protected routes for pages that require login

## Project Structure

```
src/
├── api/          # API calls and response types
├── boot/         # axios instance and route guard
├── components/   # components grouped by feature (auth, booking, home, movie, profile, sessions, layout, ui)
├── layouts/      # main layout
├── pages/        # route pages
├── router/       # routes
├── stores/       # Pinia stores (auth, filter options)
└── utils/        # helpers (dates, validation, booking)
```

## Getting Started

Requirements: Node.js 22.12+

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production (output in `dist/spa`):

```bash
npm run build
```

Lint and format:

```bash
npm run lint
```

Type check:

```bash
npm run typecheck
```

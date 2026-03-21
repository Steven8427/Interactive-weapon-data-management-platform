# Delta Force Gun Codes

A React + Supabase app for browsing, searching, copying, and managing Delta Force weapon build codes.

## Overview

This project provides two main views:

- Public home page for browsing all guns and build codes
- Admin page for adding, editing, and deleting guns and build variants

The frontend is built with React and deployed as a static site. Data is stored in Supabase.

## Tech Stack

- React 18
- React Router 6
- Supabase
- react-hot-toast
- Netlify

## Features

### Public page

- List all guns grouped by weapon
- Search by gun name, mod type, or code
- Copy build codes with one click
- Show version, price, mod type, and effective range
<img width="1914" height="918" alt="6597d8b0422dffbafb8f1bacfe3bc4bb" src="https://github.com/user-attachments/assets/5d7422f2-4d94-476a-9610-fdbb12ace83b" />
<img width="1916" height="920" alt="373f2e604b4fefef47e5702c29ea022b" src="https://github.com/user-attachments/assets/0d001364-d57d-466f-8075-c132a2471f9e" />
<img width="1919" height="938" alt="5c05bd0a679e7144ac1207ac26bae273" src="https://github.com/user-attachments/assets/60d6946d-bada-486f-81cd-0e4211de2fa1" />

### Admin page

- Admin login at `/admin`
- Add and delete guns
- Add, edit, and delete build variants
- Manage version, price, mod type, code, and effective range

<img width="1890" height="944" alt="6a7402eafa360232bc6a947260c8dc36" src="https://github.com/user-attachments/assets/b70baf97-f4a3-406b-83b6-8c3c1fa19b67" />


## Project Structure

```text
src/
  App.jsx
  index.js
  supabaseClient.js
  pages/
    Home.jsx
    Admin.jsx
  styles/
    index.css
public/
  index.html
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Create a `.env` file in the project root:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the development server

```bash
npm start
```

The app will run locally through Create React App's dev server.

## Build

```bash
npm run build
```

The production output is generated in the `build/` directory.

## Supabase Schema

This app expects at least these tables:

### `guns`

- `id`
- `name`
- `sort_order`

### `gun_variants`

- `id`
- `gun_id`
- `version`
- `price`
- `mod_type`
- `code`
- `effective_range`
- `sort_order`

### `admins`

- `id`
- `username`
- `password_hash`

## Admin Authentication

The current admin login checks the `admins` table directly and compares:

- `username`
- `password_hash`

Important: this is a simple custom login flow, not Supabase Auth. In its current form, it is suitable for internal or prototype use, but it should be hardened before production use.

Recommended improvements:

- Store hashed passwords instead of plain values
- Add Row Level Security policies
- Move admin verification to a secure backend or Supabase Auth flow

## Deployment

### Netlify

Set these values in Netlify:

- Build command: `npm run build`
- Publish directory: `build`

Also add the same environment variables from `.env` in the Netlify site settings.

## Notes

- `build/` is currently committed in this repository
- `node_modules/` exists locally but should not be committed
- The UI text appears intended for Chinese users, so keep file encoding as UTF-8 when editing content

## Scripts

- `npm start` - start local development server
- `npm run build` - build production bundle

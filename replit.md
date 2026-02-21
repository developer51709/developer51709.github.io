# Developer51709 Portfolio

## Overview
A static portfolio website for Developer51709 (Nyxen) featuring a glass UI design with light/dark themes, 3D tilt effects, parallax scrolling, and mobile-responsive navigation.

## Project Architecture
- **Type**: Static HTML/CSS/JS website served by Python HTTP server
- **Server**: `server.py` - Python SimpleHTTPServer with custom 404 handling and cache-control headers
- **Port**: 5000 (via PORT environment variable)
- **Entry Point**: `index.html`

## Structure
- `/` - Main portfolio site (index.html, style.css, script.js)
- `/Linara/` - Linara sub-project
- `/Linavo/` - Linavo sub-project with features pages
- `/AstralMod/` - AstralMod documentation
- `/tutorial/` - Tutorial pages
- `/misc/` - Miscellaneous tools
- `/profile-templates/` - Profile templates
- `/lucid-raiding/` - Lucid raiding page

## Recent Changes
- Fixed mobile navigation styling (link colors, display, text-decoration)
- Updated server to port 5000 for Replit compatibility
- Added cache-control headers to prevent stale content
- Removed bug notice from server startup

## User Preferences
- Glass UI design aesthetic
- Light/dark theme support
- Mobile-first responsive design

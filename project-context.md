# Project Context

## Project Name

Eden

## Brand Meaning

Eden is inspired by the “Garden of Eden” — a symbol of beauty, growth, creativity, harmony, and excellence.

The platform should feel like a modern digital garden for creativity and structured learning inside an arts academy environment.

It represents:
- creativity
- artistic growth
- beauty in structure
- premium education experience
- harmony between users and learning systems

---

## Organization

This application is built for:

Loveworld Arts Academy

It serves multiple creative faculties such as:
- Dance Faculty
- Fashion Faculty
- Other creative faculties (expandable over time)

Each faculty operates independently within the system.

---

## Core Concept

Eden is a multi-tenant academy management platform.

Each faculty is a separate tenant with isolated data and roles.

The system ensures strict separation between faculties:
- Dance faculty data is isolated from Fashion faculty data
- Users only access their assigned faculty
- No cross-faculty data visibility unless explicitly allowed

---

## User Roles

### 1. Admin
Highest level access within a faculty.

Responsibilities:
- Manage faculty operations
- Manage coordinators and students
- Assign and update roles
- Control faculty-wide settings
- Access full dashboard and analytics

---

### 2. Coordinators
Mid-level management users.

Responsibilities:
- Support admin operations
- Manage student activities
- Monitor student progress
- Coordinate faculty tasks

Access is restricted compared to admin.

---

### 3. Students
Default user role upon registration.

Responsibilities:
- Access learning content
- View assigned faculty resources
- Interact with student dashboard features

Students cannot access admin or coordinator tools.

---

## Authentication & Role Flow

### Registration Flow

- Every new user registers as a STUDENT by default
- After registration, user lands in the student dashboard

---

### Role Promotion Flow

Only admins can:
- promote a student to coordinator
- promote a student to admin
- assign or modify roles

Users cannot self-promote roles.

---

## Application Sections

### 1. Public Marketing Website

A minimalist, elegant landing page that introduces Eden.

Purpose:
- explain the platform
- showcase faculties
- attract new users
- encourage sign-ups

Pages:
- Landing page
- About Eden / Academy
- Faculties overview
- Contact section
- Sign up / Login

Primary CTA:
- Sign Up

Design:
- minimalist SaaS-style UI
- clean spacing
- elegant typography
- soft animations
- premium academy feel

---

### 2. Private Dashboard Application

Accessible only after authentication.

Behavior:
- UI changes based on user role
- Each faculty has its own isolated dashboard experience

Pages may include:
- dashboard overview
- faculty management tools
- student tools
- admin controls
- analytics sections

---

## UI / UX Design System

### Overall Style

Eden follows a:
- minimalist SaaS-inspired design
- premium academy interface
- clean and modern UI
- calm and elegant visual tone

---

### Design Inspiration

Inspired by:
- “Garden of Eden” concept
- nature growth and harmony
- creative artistic environments
- modern SaaS dashboards

---

### Color System

Primary Identity Colors:
- Deep Forest Green: `#14532D`
- Emerald Accent: `#10B981`
- Soft Gold Accent: `#F59E0B`

Neutral System:
- Light Background: `#F8FAF7`
- Dark Background: `#07130D`

Glass UI:
- rgba(255, 255, 255, 0.08)
- blur-based transparency

Text Colors:
- Primary: `#111827`
- Secondary: `#6B7280`

---

### Typography

Font Family:
- Inter

Style:
- clean
- modern
- highly readable
- minimal aesthetic

---

### Layout Philosophy

- spacious design
- strong spacing hierarchy
- clean alignment
- minimal clutter
- structured content flow

---

### Dashboard UI Style

- glassmorphism-based interface
- translucent cards with blur effects
- soft borders and subtle shadows
- modern SaaS dashboard structure
- role-based UI rendering

---

### Animation Rules

- subtle and minimal animations only
- smooth transitions
- soft fade-ins
- gentle hover effects
- no heavy motion or distractions

---

### Theme System

- Light mode support
- Dark mode support
- Theme toggle available globally
- persistent theme preference

---

## Logo Direction

The Eden logo is a typography-focused mark combining elegance and growth.

Style:
- Bold serif typography ("Eden")
- Integrated organic elements (two leaves sprouting above the 'e')
- Scalable vector format
- Adapts perfectly to dark mode (crisp white) and light mode (deep green)

Meaning:
- growth (represented by the leaves)
- creativity
- elegance (represented by the serif font)
- education
- harmony

Avoid:
- complex illustrations
- cartoon styles
- overly detailed graphics

Color:
- Light Mode: Deep Green
- Dark Mode: Pure White

---

## Architecture Goals

- scalable Next.js architecture
- multi-tenant system support
- role-based access control (RBAC)
- secure authentication system
- clean separation of concerns
- modular and reusable components
- performance-optimized frontend

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- TanStack Query (React Query)

---

## Key System Principles

- Users must only access permitted data
- Strict role-based UI rendering
- Faculty-level data isolation
- Clean and maintainable architecture
- Feature-based folder structure
- Scalable UI system for future expansion

---

## Main Product Goal

To build a premium, scalable, and visually elegant academy management system that supports multiple creative faculties while maintaining strict role-based access and a modern SaaS experience.
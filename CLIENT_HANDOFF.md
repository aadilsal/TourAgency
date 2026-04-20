# JunketTours Client Handoff

This document explains the main product flows, how to test them, and what can be customized for your team.

## Product Overview

JunketTours is a tour booking and travel operations platform with:

- public marketing pages for tours, destinations, blog, and contact
- customer registration, login, and booking dashboard
- guest booking support for users without an account
- admin tools for tours, bookings, users, destinations, blog, analytics, and custom itineraries
- AI trip planner for matching tours and generating trip suggestions
- WhatsApp and email contact flows

## Main Flows

### 1. Public Visitor Flow

What a visitor can do:

- browse the homepage and landing pages
- view tours and tour details
- explore destinations and blog posts
- open the AI trip planner
- contact the business through the website

How to test:

1. Open the live site.
2. Visit the homepage and confirm the hero, featured tours, and call-to-action buttons load.
3. Open a tour detail page and verify gallery, itinerary, booking section, map, and related tours.
4. Open a destination page and verify related content loads.
5. Open the blog listing and a blog article.
6. Open the contact page and confirm phone, email, address, map, and WhatsApp links appear.

### 2. Customer Flow

What a customer can do:

- register a new account
- log in and out
- view their dashboard
- check booking history
- update profile details
- use the AI planner and keep chatting with it

How to test:

1. Go to the register page.
2. Create a new customer account with a unique email and password.
3. Log in with that account.
4. Open the dashboard and confirm the bookings and profile pages work.
5. Use the AI planner to create a trip request.
6. Ask a follow-up question in the planner to confirm the chat continues.
7. Log out and confirm the session ends correctly.

### 3. Guest Booking Flow

What a guest can do:

- book without creating an account
- submit trip details from the tour page
- be linked to an account later if they register with the same details

How to test:

1. Open a tour detail page.
2. Use the booking section without logging in.
3. Submit the booking form.
4. Confirm the booking is created and visible in the admin area.
5. Register later with the same phone or email and confirm guest history can be linked where supported.

### 4. AI Planner Flow

What it does:

- matches the user request to live tours
- returns a plan in the assistant reply
- includes matching tours and a suggested itinerary
- keeps the conversation open for follow-up questions
- creates a custom quote request when the request needs one

How to test:

1. Open the AI planner.
2. Enter budget, duration, departure city, and preferences.
3. Generate a plan.
4. Confirm the assistant reply includes the suggested itinerary and matching tours.
5. Ask a follow-up question in the same chat.
6. If the planner marks the trip as custom, fill the quote form and submit it.

## Admin Testing Access

Use these credentials for testing admin flows:

- Super admin: `hairythelion@gmail.com` / `Sheru@123`
- Admin: `test@gmail.com` / `Testing@1234`

Recommended order of testing:

1. Log in as super admin first.
2. Confirm you can access the admin dashboard.
3. Test creating, editing, and publishing tours.
4. Test booking management.
5. Test users and destinations.
6. Test blog post creation and updates.
7. Test analytics and custom itineraries.
8. Log in as the regular admin and confirm the reduced admin flow still works.

## Step-by-Step Admin Panel Test Guide

### A. Super Admin Test

1. Go to the login page.
2. Sign in with the super admin credentials above.
3. Open the admin dashboard.
4. Confirm that all admin sections are visible.
5. Check tours, bookings, users, destinations, blog, analytics, and custom itineraries.
6. Create or edit a sample tour.
7. Check that the tour appears on the public site.
8. Update a blog post or create a new one.
9. Review analytics or reports if present.

### B. Admin Test

1. Log out.
2. Log back in with the admin credentials above.
3. Confirm the admin dashboard loads.
4. Test the admin actions that are allowed for this role.
5. Confirm restricted sections are hidden or read-only if that is the intended behavior.

### C. Customer Test

1. Log out from admin.
2. Register a new customer account.
3. Log in as that customer.
4. Open the dashboard.
5. Confirm the customer can see their own booking history and profile area only.

## Step-by-Step User Panel Test Guide

### A. New Registration

1. Open the register page.
2. Enter name, email, phone, and password.
3. Submit the form.
4. Confirm the account is created.
5. Confirm login works.

### B. Login and Session

1. Open the login page.
2. Sign in with a valid customer account.
3. Refresh the page and confirm the session stays active.
4. Log out and confirm the session is cleared.

### C. Dashboard

1. Open the dashboard after login.
2. Check the bookings page.
3. Check the profile page.
4. Confirm no admin-only controls are visible.

### D. Booking a Tour

1. Open a tour page.
2. Click the booking action.
3. Fill in trip details.
4. Submit the booking.
5. Confirm the booking shows up in the admin panel.

## How To Verify The AI Planner

1. Ask for a family trip with budget and duration.
2. Confirm the response includes a written summary.
3. Confirm matching tours are included in the same reply.
4. Confirm the itinerary is visible in the same reply.
5. Ask a follow-up question to change the route or budget.
6. If a custom quote is needed, confirm the draft appears and can be sent to the team.

## What Can Be Customized For You

The platform can be tailored to your business needs.

### Theme and Branding

- logo and brand colors
- fonts and typography
- button styles and CTA wording
- layout spacing and section order
- homepage hero content
- footer contact details
- WhatsApp button behavior
- map location and office details

### Business Rules

- booking form fields
- pricing display style
- tour categories
- destination structure
- admin role permissions
- notification recipients
- email templates
- lead routing rules

### Content

- homepage copy
- tour descriptions
- destination guides
- blog content
- FAQ content
- contact information

## Future AI Features We Can Add

Here are strong next-step AI features that can be added later:

- AI budget optimizer that recommends tours based on spend range
- AI family suitability score for kids, elders, honeymoon, or groups
- AI route builder that compares travel time and road conditions
- AI packing list generator based on destination and season
- AI weather-aware trip suggestions
- AI itinerary export to PDF or WhatsApp
- AI upsell suggestions for transport, guides, and hotel upgrades
- AI assistant for admins to draft tour descriptions and blog posts
- AI FAQ bot trained on your live catalog and policies
- AI availability assistant that suggests alternatives when a tour is full
- AI quote assistant that drafts custom itinerary packages for the sales team

## Notes For The Client

- The AI planner is live and conversational, so users can keep asking follow-up questions after the initial response.
- The system already supports both guest and registered flows.
- The experience can be simplified or expanded depending on your internal process.
- Theme, content, and flow order can all be adjusted without changing the business logic.

## Internal Testing Checklist

- public site loads
- customer registration works
- customer login works
- guest booking works
- admin login works
- super admin login works
- tour CRUD works
- booking management works
- blog CRUD works
- destination pages work
- AI planner returns a full reply
- AI planner supports follow-up chat
- custom quote requests can be sent

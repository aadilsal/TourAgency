# JunketTours Client Handoff

Live site: https://touragency-wheat.vercel.app

JunketTours is a modern tour booking and travel operations platform built for Pakistan adventure travel. It supports public browsing, guest bookings, customer accounts, admin operations, and an AI trip planner that matches real tour packages from the live catalog.

## What The Platform Includes

- Public website with homepage, tours, destinations, blog, contact, and landing pages
- Customer registration, login, bookings, and dashboard
- Guest booking flow for users without an account
- Admin panel for tours, bookings, users, destinations, blog posts, analytics, and custom itineraries
- AI trip planner with follow-up chat and custom quote escalation
- WhatsApp and email contact touchpoints

## Primary User Flows

### Public Visitor Flow

Visitors can browse the site without logging in. They can explore tours, view destination pages, read blog posts, open the AI planner, and use the contact page.

How to test:

1. Open the live site.
2. Review the homepage for hero content, featured tours, and calls to action.
3. Open a tour detail page and verify the gallery, itinerary, booking area, map, and related tours.
4. Open a destination page and confirm related content loads.
5. Open the blog and a blog post.
6. Open the contact page and verify phone, email, address, map, and WhatsApp links.

### Customer Flow

Customers can create an account, sign in, and use their personal dashboard. They can also use the AI planner and keep chatting after the first response.

How to test:

1. Open the register page.
2. Create a new account using a unique email.
3. Log in with the new account.
4. Open the dashboard and verify the bookings and profile pages.
5. Start an AI trip planning conversation.
6. Ask a follow-up question to confirm the chat continues naturally.
7. Log out and confirm the session ends correctly.

### Guest Booking Flow

Guests can submit a booking without creating an account. This is useful for quick lead capture and faster conversions.

How to test:

1. Open a tour page.
2. Use the booking flow without logging in.
3. Submit the booking form.
4. Confirm the booking is visible in the admin panel.
5. If the guest later registers with matching details, the system can link prior guest activity where supported.

### AI Planner Flow

The AI planner matches the user request to real tours, returns a day-by-day outline, and keeps the conversation open for follow-up questions. If the request needs a custom package, it creates a draft for the team to price and approve.

How to test:

1. Open the AI planner.
2. Enter budget, duration, departure city, and preferences.
3. Generate a plan.
4. Confirm the response includes the plan summary, matching tours, and itinerary.
5. Ask follow-up questions to refine the trip.
6. If a custom quote is needed, fill the form and submit it.

## Admin Testing Access

Use these credentials for internal testing of the admin flows:

- Super admin: hairythelion@gmail.com / Sheru@123
- Admin: test@gmail.com / Testing@1234

Recommended testing order:

1. Log in as super admin.
2. Confirm access to the full admin dashboard.
3. Test tour create, edit, and publish flows.
4. Test booking management.
5. Test users, destinations, and blog operations.
6. Test analytics and custom itineraries.
7. Log out and repeat as the regular admin account.

## Step-by-Step Test Guide

### Super Admin Test

1. Go to the login page.
2. Sign in using the super admin credentials above.
3. Open the admin dashboard.
4. Confirm all admin sections are available.
5. Create or edit a sample tour.
6. Verify the tour appears on the public site.
7. Create or update a blog post.
8. Review analytics or reporting screens if available.

### Admin Test

1. Log out.
2. Log in with the admin credentials above.
3. Confirm the admin dashboard loads correctly.
4. Validate the actions available for this role.
5. Confirm any restricted sections are hidden or limited as intended.

### Customer Test

1. Log out from admin.
2. Register a new customer account.
3. Log in as the customer.
4. Open the dashboard.
5. Confirm the customer sees only their own account area and booking information.

## Customer Registration And User Panel

Customers can start by registering a new account.

How to test:

1. Open the register page.
2. Fill in name, email, phone, and password.
3. Submit the form.
4. Confirm the account is created successfully.
5. Log in and confirm the dashboard is available.
6. Test the profile page.
7. Test the bookings page.

## What Can Be Customized

The platform can be tailored to match your brand and operational needs.

### Branding And Theme

- logo and brand colors
- typography and button styles
- section order and page structure
- homepage hero content
- footer content and contact details
- WhatsApp button behavior
- map location and office details

### Business Logic

- form fields and booking requirements
- role permissions
- notification routing
- email templates
- lead handling rules
- tour categories and destination hierarchy
- admin flow adjustments

### Content

- homepage copy
- tour copy
- destination guides
- blog articles
- FAQ content
- contact information

## Future AI Features We Can Add

The AI system can be expanded further. Strong next-step additions include:

- AI budget optimizer that suggests the best package for the user’s spend range
- AI family suitability scoring for couples, families, honeymooners, and groups
- AI route builder that compares travel time and road conditions
- AI packing list generator based on destination and season
- AI weather-aware trip suggestions
- AI itinerary export to PDF or WhatsApp
- AI upsell recommendations for transport, hotel upgrades, and guides
- AI FAQ assistant trained on your live catalog and policies
- AI availability assistant that suggests alternatives when a tour is full
- AI quote assistant that drafts custom itineraries for your sales team

## Client Notes

- The AI planner already supports live follow-up chat after the first reply.
- Guest and registered customer flows both work.
- The theme, copy, and flow order can be adjusted to fit your brand.
- The platform is designed to grow with additional automation and AI features.

## Internal Verification Checklist

- public site loads
- customer registration works
- customer login works
- guest booking works
- super admin login works
- admin login works
- tour management works
- booking management works
- blog management works
- destination pages work
- AI planner returns a full reply
- AI planner supports follow-up chat
- custom quote requests can be submitted

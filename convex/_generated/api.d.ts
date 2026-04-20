/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as aiRequests from "../aiRequests.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as blog from "../blog.js";
import type * as bookings from "../bookings.js";
import type * as customItineraries from "../customItineraries.js";
import type * as dashboard from "../dashboard.js";
import type * as destinations from "../destinations.js";
import type * as email from "../email.js";
import type * as leads from "../leads.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_resolveTourImages from "../lib/resolveTourImages.js";
import type * as lib_syncTourImageAssets from "../lib/syncTourImageAssets.js";
import type * as media from "../media.js";
import type * as mediaActions from "../mediaActions.js";
import type * as plannerChatSessions from "../plannerChatSessions.js";
import type * as seed from "../seed.js";
import type * as siteSettings from "../siteSettings.js";
import type * as tours from "../tours.js";
import type * as users from "../users.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  aiRequests: typeof aiRequests;
  analytics: typeof analytics;
  auth: typeof auth;
  authActions: typeof authActions;
  blog: typeof blog;
  bookings: typeof bookings;
  customItineraries: typeof customItineraries;
  dashboard: typeof dashboard;
  destinations: typeof destinations;
  email: typeof email;
  leads: typeof leads;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/resolveTourImages": typeof lib_resolveTourImages;
  "lib/syncTourImageAssets": typeof lib_syncTourImageAssets;
  media: typeof media;
  mediaActions: typeof mediaActions;
  plannerChatSessions: typeof plannerChatSessions;
  seed: typeof seed;
  siteSettings: typeof siteSettings;
  tours: typeof tours;
  users: typeof users;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

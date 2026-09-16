/**
 * There used to be two competing screens for the same `customItineraryRequests`
 * table (this one and the AI planner panel), with different features and the
 * same window.prompt bugs. They are now one component.
 */
export { AdminAiPlannerRequestsPanel as AdminCustomItinerariesPanel } from "./AdminAiPlannerRequestsPanel";

// Coordinates notification deep-links with the auth boot. A notification tap
// can fire before the app has authenticated and routed to the deck — navigating
// then races index.js's router.replace('/swipe'), which double-loads the app
// and often lands the user on the wrong screen. So we stash the route and let
// the deck consume it once the app is actually ready (authenticated + mounted).
let pendingRoute = null;
let ready = false;

// Called from the notification response handler. Navigate now if the app is
// ready, otherwise hold the route until it is.
export function routeFromNotification(route, navigate) {
  if (ready) navigate(route);
  else pendingRoute = route;
}

// Called by the deck once it mounts (user is authenticated and on screen).
// Flushes any route a notification stashed during launch.
export function markReady(navigate) {
  ready = true;
  if (pendingRoute) {
    const r = pendingRoute;
    pendingRoute = null;
    // Defer a tick so the deck has finished mounting before we push onto it.
    setTimeout(() => navigate(r), 0);
  }
}

// Called on logout so a stale session can't deep-link into authed screens.
export function markNotReady() {
  ready = false;
  pendingRoute = null;
}

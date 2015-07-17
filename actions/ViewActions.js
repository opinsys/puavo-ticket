
import fetch from "./fetch";

export function fetchViews(context) {
    return context.executeAction(fetch, {path: "/api/views"})
    .then(data => context.dispatch("SET_VIEWS", data));
}


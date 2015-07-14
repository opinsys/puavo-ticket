

import fetch from "./fetch";
import url from "url";

export function fetchTickets(context, payload) {
    return context.executeAction(fetch, url.format({
        pathname: "/api/tickets",
        query: payload.query
    }))
    .then(data => {
        context.dispatch("SET_TICKETS", data);
        if (payload.viewId) {
            context.dispatch("SET_VIEW_TICKETS", {
                viewId: payload.viewId,
                ticketIds: data.map(t => t.id)
            });
        }
    });
}

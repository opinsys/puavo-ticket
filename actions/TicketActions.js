

import fetch from "./fetch";
import url from "url";

export function fetchTickets(context, payload) {
    return context.executeAction(fetch, url.format({
        pathname: "/api/tickets",
        query: payload.query
    }))
    .then(data => {
        context.dispatch("SET_TICKETS", data);

        context.dispatch("SET_COMMENTS", data.reduce((comments, ticket) => {
            return comments.concat(ticket.comments);
        }, []));

        if (payload.viewId) {
            context.dispatch("SET_VIEW_TICKETS", {
                viewId: payload.viewId,
                ticketIds: data.map(t => t.id)
            });
        }
    });
}

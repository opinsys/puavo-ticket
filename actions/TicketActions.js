

import fetch from "./fetch";
import url from "url";
import R from "ramda";


const getComments = R.compose(R.flatten, R.map(R.prop("comments")));
const removeComments = R.map(R.dissoc("comments"));


export function fetchTickets(context, payload) {
    return context.executeAction(fetch, url.format({
        pathname: "/api/tickets",
        query: payload.query
    }))
    .then(data => {
        context.dispatch("SET_TICKETS", removeComments(data));
        context.dispatch("SET_COMMENTS", getComments(data));

        if (payload.viewId) {
            context.dispatch("SET_VIEW_TICKETS", {
                viewId: payload.viewId,
                ticketIds: data.map(t => t.id)
            });
        }
    });
}

export function fetchFullTicket(context, ticketId) {
    return context.executeAction(fetch, url.format({
        pathname: "/api/tickets/" + ticketId
    }))
    .then(data => {
        context.dispatch("SET_TICKETS", removeComments([data]));
        context.dispatch("SET_COMMENTS", getComments([data]));
    });
}

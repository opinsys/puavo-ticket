

import fetch from "./fetch";
import url from "url";
import R from "ramda";

import {fetchUsers} from "./UserActions";

const getComments = R.compose(R.flatten, R.map(R.prop("comments")));
const removeComments = R.map(R.dissoc("comments"));


export async function fetchTickets(context, payload) {
    var path = url.format({
        pathname: "/api/tickets",
        query: payload.query
    });

    var data = await context.executeAction(fetch, {path});
    var tickets = removeComments(data);
    var comments = getComments(data);

    var userIds = R.concat(
        comments.map(c => c.createdById),
        tickets.map(t => t.createdById)
    );

    await context.executeAction(fetchUsers, {ids: userIds});

    context.dispatch("SET_TICKETS", tickets);
    context.dispatch("SET_COMMENTS", comments);

    if (payload.viewId) {
        context.dispatch("SET_VIEW_TICKETS", {
            viewId: payload.viewId,
            ticketIds: data.map(t => t.id)
        });
    }
}

export function fetchFullTicket(context, ticketId) {
    return context.executeAction(fetch, {path: "/api/tickets/" + ticketId})
    .then(data => {
        context.dispatch("SET_TICKETS", removeComments([data]));
        context.dispatch("SET_COMMENTS", getComments([data]));
    });
}

export function createComment(context, payload) {
    var path = "/api/tickets/" + payload.ticketId + "/comments";
    return context.executeAction(fetch, {
        path,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({comment: payload.comment})
    })
    .then(comment => {
        context.dispatch("SET_COMMENTS", [comment]);
    });
}



import fetch from "./fetch";
import url from "url";
import R from "ramda";

import {fetchUsers} from "./UserActions";

const getComments = R.compose(R.flatten, R.map(R.prop("comments")));
const removeComments = R.map(R.dissoc("comments"));

async function dispatchTickets(context, data) {
    var tickets = removeComments(data);
    var comments = getComments(data);

    var userIds = R.concat(
        comments.map(c => c.createdById),
        tickets.map(t => t.createdById)
    );

    await context.executeAction(fetchUsers, {ids: userIds});

    context.dispatch("SET_TICKETS", tickets);
    context.dispatch("SET_COMMENTS", comments);

}


export async function fetchTickets(context, payload) {
    var path = url.format({
        pathname: "/api/tickets",
        query: payload.query
    });

    var data = await context.executeAction(fetch, {path});
    await dispatchTickets(context, data);

    if (payload.viewId) {
        context.dispatch("SET_VIEW_TICKETS", {
            viewId: payload.viewId,
            ticketIds: data.map(t => t.id)
        });
    }
}

export async function fetchFullTicket(context, ticketId) {
    var ticketData = await context.executeAction(fetch, {path: "/api/tickets/" + ticketId});
    await dispatchTickets(context, [ticketData]);
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

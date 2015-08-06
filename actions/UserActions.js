
import R from "ramda";

import fetch from "./fetch";
import UsersStore from "../stores/UsersStore";

export async function fetchUsers(context, payload) {
    let {ids} = payload;

    if (!payload.force) {
        let store = context.getStore(UsersStore);
        ids = R.difference(payload.ids, store.getKnownUserIds());
    }

    ids = R.uniq(ids);

    if (ids.length === 0) return;

    var users = await context.executeAction(fetch, {path: {
        pathname: "/api/users",
        query: {ids: ids.join(",")}
    }});
    context.dispatch("SET_USERS", users);

}

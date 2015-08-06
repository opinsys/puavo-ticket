
import StateStore from "./StateStore";
import R from "ramda";


export default class UsersStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = {
            users: {}
        };
    }

    handleSetUsers(users) {
        users = R.reduce((m, u) => {
            m[u.id] = u;
            return u;
        }, {}, users);

        this.state = R.assoc("users", R.merge(users, this.state.users), this.state);
        this.emitChange();
    }

    getKnownUserIds() {
        return Object.keys(this.state.users);
    }


}

UsersStore.storeName = "UsersStore";
UsersStore.handlers = {
    SET_USERS: "handleSetUsers"
};


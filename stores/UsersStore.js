
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
        users.forEach(u => {
            this.state = R.assocPath(["users", u.id], u, this.state);
        });
        this.emitChange();
        console.log("users", this.state);
    }

    getUser(userId) {
        var user = this.state.users[userId];
        if (!user) {
            throw new Error("User " + userId + " is not loaded");
        }
        return user;
    }

    getKnownUserIds() {
        return Object.keys(this.state.users);
    }


}

UsersStore.storeName = "UsersStore";
UsersStore.handlers = {
    SET_USERS: "handleSetUsers"
};


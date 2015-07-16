import StateStore from "./StateStore";
import I from "icepick";
import values from "lodash/object/values";


export default class CommentsStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = I.freeze({
            comments: {}
        });
    }

    handleSetComments(comments) {

        comments.forEach(comment => {
            if (!this.state.comments[comment.ticketId]) {
                this.state = I.assocIn(this.state, ["comments", comment.ticketId], {});
            }

            console.log("setting", comment.id);
            this.state = I.assocIn(this.state, ["comments", comment.ticketId, comment.id], comment);
        });

        this.emitChange();
    }

    getComments(ticketId) {
        return values(this.state.comments[ticketId] || {});
    }

}

CommentsStore.storeName = "CommentsStore";
CommentsStore.handlers = {
    SET_COMMENTS: "handleSetComments"
};


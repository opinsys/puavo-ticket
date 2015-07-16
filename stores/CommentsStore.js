import StateStore from "./StateStore";
import R from "ramda";


export default class CommentsStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = {
            comments: {}
        };
    }

    handleSetComments(comments) {

        comments.forEach(comment => {
            this.state = R.assocPath(["comments", comment.ticketId, comment.id], comment, this.state);
        });

        this.emitChange();
    }

    getComments(ticketId) {
        return R.values(this.state.comments[ticketId]);
    }

}

CommentsStore.storeName = "CommentsStore";
CommentsStore.handlers = {
    SET_COMMENTS: "handleSetComments"
};


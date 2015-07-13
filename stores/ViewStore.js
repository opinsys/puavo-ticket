
import StateStore from "./StateStore";


export default class ViewStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = { views: [] };
    }

    handleSetViews(views) {
        this.setState({views});
    }
}

ViewStore.storeName = "ViewStore";
ViewStore.handlers = {
    SET_VIEWS: "handleSetViews"
};


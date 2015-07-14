
import StateStore from "./StateStore";


export default class AjaxStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = {
            activeReads: 0,
            activeWrites: 0,
            errors: []
        };
    }

    handleFetchStart({options}) {
        this.updateCount(options.method, (count) => count + 1);
    }

    handleFetchEnd({options}) {
        this.updateCount(options.method, (count) => count - 1);
    }

    isActive() {
        return this.state.activeReads > 0 || this.state.activeWrites > 0;
    }

    updateCount(method, mutate) {
        switch (method) {
            case "GET":
                this.setState({ activeReads: mutate(this.state.activeReads) });
                break;
            case "POST":
                this.setState({ activeWrites: mutate(this.state.activeWrites) });
                break;
            default:
                console.warn("AjaxStore: Unknown method: " + method );
        }
    }



}

AjaxStore.storeName = "AjaxStore";
AjaxStore.handlers = {
    "FETCH_START": "handleFetchStart",
    "FETCH_END": "handleFetchEnd"
};


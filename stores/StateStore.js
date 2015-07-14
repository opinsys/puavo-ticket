
import BaseStore from "fluxible/addons/BaseStore";

export default class StateStore extends BaseStore {

    constructor(dispatcher) {
        super(dispatcher);

        this.state = {};
    }


    setState(state) {
        this.state = Object.assign({}, this.state, state);
        this.emitChange();
    }

    dehydrate() {
        return this.state;
    }

    rehydrate(state) {
        this.state = state;
    }

}

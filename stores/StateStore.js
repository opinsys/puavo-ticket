
import BaseStore from "fluxible-addons-react/BaseStore";

export default class StateStore extends BaseStore {

    constructor(dispatcher) {
        super(dispatcher);

        this.state = {};
    }


    setState(state) {
        this.state = Object.assign({}, this.state, state);
    }

    dehydrate() {
        return this.state;
    }

    rehydrate(state) {
        this.state = state;
    }

}

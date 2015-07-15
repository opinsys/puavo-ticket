import StateStore from "./StateStore";
import I from "icepick";



export default class TicketStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = I.freeze({
            tickets: {}
        });
    }

    handleSetTickets(tickets) {
        tickets = tickets.reduce((ob, t) => {
            ob[t.id] = t;
            return ob;
        }, {});

        this.state = I.updateIn(this.state, ["tickets"], (current) => I.assign(current, tickets));
        this.emitChange();
    }

    getTicketFor(ids) {
        return ids.map(id => this.state.tickets[id]);
    }

}

TicketStore.storeName = "TicketStore";
TicketStore.handlers = {
    SET_TICKETS: "handleSetTickets"
};


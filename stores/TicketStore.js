

import StateStore from "./StateStore";


export default class TicketStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = {
            tickets: {}
        };
    }

    handleSetTickets(tickets) {
        tickets = tickets.reduce((ob, t) => {
            ob[t.id] = t;
            return ob;
        }, {});

        this.setState({
            tickets: Object.assign({}, this.state.tickets, tickets)
        });
    }

}

TicketStore.storeName = "TicketStore";
TicketStore.handlers = {
    SET_TICKETS: "handleSetTickets"
};


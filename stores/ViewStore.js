
import StateStore from "./StateStore";
import TicketStore from "./TicketStore";
import I from "icepick";

export default class ViewStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = {
            views: [],
            ticketsPerView: {}
        };
    }

    handleSetViews(views) {
        console.log("settings views");
        this.setState({views});
    }

    handleSetViewTickets({viewId, ticketIds}) {
        this.state = I.assocIn(this.state, ["ticketsPerView", viewId], ticketIds);
        this.emitChange();
    }

    getView(id) {
        const view = this.state.views.find(view => {
            return String(view.id) === String(id);
        });

        if (!view) throw new Error("Unknown view id: " + id);

        return view;
    }


    getTicketsForView(viewId) {
        if (!this.state.ticketsPerView[viewId]) {
            console.error("Unknown view id: " + viewId);
            return [];
        }

        return this.dispatcher.getStore(TicketStore)
            .getTicketFor(this.state.ticketsPerView[viewId]);
    }

}

ViewStore.storeName = "ViewStore";
ViewStore.handlers = {
    SET_VIEWS: "handleSetViews",
    SET_VIEW_TICKETS: "handleSetViewTickets"
};



import StateStore from "./StateStore";


export default class ViewStore extends StateStore {

    constructor(dispatcher) {
        super(dispatcher);
        this.state = {
            views: []
            ticketsPerView: {}
        };
    }

    handleSetViews(views) {
        console.log("settings views");
        this.setState({views});
    }

    handleSetViewTickets({viewId, ticketIds}) {
        const update = {};
        update[viewId] = ticketIds;

        this.setState({
            ticketsPerView: Object.assign({}, this.state.ticketsPerView, update)
        });

    }

    getView(id) {
        return this.state.views.find(view => {
            return String(view.id) === String(id);
        });
    }

}

ViewStore.storeName = "ViewStore";
ViewStore.handlers = {
    SET_VIEWS: "handleSetViews",
    SET_VIEW_TICKETS: "handleSetViewTickets"
};


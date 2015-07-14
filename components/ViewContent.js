

import React from "react";
import PureComponent from "react-pure-render/component";


export default class ViewContent extends PureComponent {
    render() {
        return (
            <div className="ViewContent">
                <h1>view list</h1>
                <ul>
                    {this.props.tickets.map(ticket => <li key={ticket.id}>{ticket.title}</li>)}
                </ul>
            </div>
        );
    }
}

ViewContent.defaultProps = {
    tickets: []
};

ViewContent.propTypes = {
    name: React.PropTypes.string.isRequired,
    tickets: React.PropTypes.array.isRequired
};




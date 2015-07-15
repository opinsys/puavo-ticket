

import React from "react";
import PureComponent from "react-pure-render/component";
import last from "lodash/array/last";
import {Link} from "react-router";


export default class ViewContent extends PureComponent {
    render() {
        return (
            <div className="ViewContent">
                <ul>
                    {this.props.tickets.map(ticket => {
                        return (
                            <li key={ticket.id}>
                                <Link to={"/tickets/" + ticket.id}>
                                    {last(ticket.titles).title}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

ViewContent.defaultProps = {
    tickets: []
};

ViewContent.propTypes = {
    tickets: React.PropTypes.array.isRequired
};




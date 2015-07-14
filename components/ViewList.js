
import React from "react";
import PureComponent from "react-pure-render/component";
import {Link} from "react-router";


export default class ViewList extends PureComponent {
    render() {
        return (
            <div className="ViewList">
                <h1>view list</h1>
                <ul>
                    {this.props.views.map(view => {
                        return (
                            <li key={view.id}>
                                <Link to={"/views/" + view.id}>
                                    {view.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

ViewList.propTypes = {
    views: React.PropTypes.array.isRequired
};




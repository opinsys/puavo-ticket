
import React from "react";


export default class ViewList extends React.Component {
    render() {
        return (
            <div className="ViewList">
                <h1>view list</h1>
                <ul className="ViewList">
                    {/*this.props.views.map(view => <li>{view.name}</li>)*/}
                </ul>
            </div>
        );
    }
}

ViewList.propTypes = {
    views: React.PropTypes.array.isRequired
};




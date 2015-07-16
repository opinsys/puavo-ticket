
import React from "react";
import PureComponent from "react-pure-render/component";


export default class TicketComments extends PureComponent {
    render() {
        return (
            <div className="TicketComments">
                <ul>
                    {this.props.comments.map(comment => {
                        return (
                            <li key={comment.id}>
                                {comment.comment}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

TicketComments.defaultProps = {
    comments: []
};

TicketComments.propTypes = {
    comments: React.PropTypes.array.isRequired
};




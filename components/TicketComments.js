/*eslint camelcase:0*/
import React from "react";
import PureComponent from "react-pure-render/component";
import connectToStores from "fluxible-addons-react/connectToStores";

import UsersStore from "../stores/UsersStore";

class Comment extends PureComponent {

    render() {
        const {first_name, last_name} = this.props.creator.externalData;
        return (
            <div className="Comment">
                {this.props.comment.comment}
                by {first_name} {last_name}
            </div>
        );
    }
}


Comment.propTypes = {
    comment: React.PropTypes.object.isRequired,
    creator: React.PropTypes.object.isRequired
};


Comment = connectToStores(Comment, [UsersStore], (context, props) => {
    var creator = context.getStore(UsersStore).getUser(props.comment.createdById);
    return {creator};
});


export default class TicketComments extends PureComponent {
    render() {
        return (
            <div className="TicketComments">
                <ul>
                    {this.props.comments.map(comment => {
                        return (
                            <li key={comment.id}>
                                <Comment comment={comment} />
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





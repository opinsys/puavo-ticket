
import React from "react";
import PureComponent from "react-pure-render/component";


export default class CommentInput extends PureComponent {

    constructor(props) {
        super(props);
        this.state = {comment: ""};
    }

    createComment() {
        this.props.createComment({
            ticketId: this.props.ticketId,
            comment: this.state.comment
        });
        this.setState({comment: ""});
    }

    render() {
        return (
            <div className="CommentInput">
                <input type="text"
                    value={this.state.comment}
                    onChange={e => this.setState({comment: e.target.value})}
                    onKeyUp={e => {
                        if (e.key === "Enter") this.createComment();
                    }} />
            </div>
        );
    }
}

CommentInput.propTypes = {
    createComment: React.PropTypes.func.isRequired,
    ticketId: React.PropTypes.string.isRequired
};

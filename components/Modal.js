/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var classSet = React.addons.classSet;

var BModal = require("react-bootstrap/Modal");

/**
 * @namespace components
 * @class Modal
 * @constructor
 * @param {Object} props
 * @param {Boolean} [props.permanent] Disable hiding on background or x click
 */
var Modal = React.createClass({


    propTypes: {
        permanent: React.PropTypes.bool,
        onRequestHide: React.PropTypes.func,
    },

    getDefaultProps: function() {
        return {
            permanent: false,
            onRequestHide: function() { }
        };
    },

    componentDidMount: function() {
        this.originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        this.pageScrollPosition = [window.scrollX, window.scrollY];
        window.addEventListener("scroll", this.restoreScroll);
    },

    restoreScroll: function() {
        window.scrollTo.apply(window, this.pageScrollPosition);
    },

    componentWillUnmount: function() {
        document.body.style.overflow = this.originalBodyOverflow;
        window.removeEventListener("scroll", this.restoreScroll);
        this.restoreScroll();
    },

    handleHideRequest: function(e) {
        if (this.props.permanent) return;
        this.props.onRequestHide(e);
    },

    render: function() {

        var className = classSet({
            Modal: true,
            "no-close": this.props.permanent
        });

        return (
            <BModal className={className} onRequestHide={this.handleHideRequest} title={this.props.title}>
                <div className="modal-scroll">
                    {this.props.children}
                </div>
            </BModal>
        );
    }
});

module.exports = Modal;

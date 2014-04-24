/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Backbone = require("backbone");

var Device = require("../models/client/Device");
var Lightbox = require("./Lightbox");
var EventMixin = require("../utils/EventMixin");

var DeviceCollection = Backbone.Collection.extend({

    url: function() {
        return "/api/puavo/v3/devices";
    },

});


var AddDevice = React.createClass({

    mixins: [EventMixin],

    componentDidMount: function() {
        this.reactTo(this.state.device);
        this.reactTo(this.state.deviceCollection);
        this.state.deviceCollection.fetch();
    },

    getInitialState: function() {
        return {
            device: new Device(),
            deviceCollection: new DeviceCollection()
        };
    },

    handleAdd: function(e) {
        this.state.device.set("hostname", this.refs.select.getDOMNode().value);
        var updates = this.props.ticketModel.updates();
        updates.add(this.state.device);
        this.state.device.save()
        .then(function() {
            Lightbox.removeCurrentComponent();
        });
    },

    render: function() {
        return (
            <div>
                {this.state.device.isOperating() && "Saving..."}
                <select ref="select">
                    {this.state.deviceCollection.map(function(d) {
                        return <option>{d.get("hostname")}</option>;
                    })}
                </select>
                {this.state.deviceCollection.size() === 0 && "Loading..."}
                <button onClick={this.handleAdd}>Add</button>
            </div>
        );
    }

});


module.exports = AddDevice;

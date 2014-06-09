/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var Device = require("../models/client/Device");
var Lightbox = require("./Lightbox");
var Base = require("../models/client/Base");

var DeviceCollection = Base.Collection.extend({

    url: function() {
        return "/api/puavo/v3/devices";
    },

});


var AddDevice = React.createClass({

    componentDidMount: function() {
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
            <h2>Lisää laite</h2>
                <div className="adddevice">
                    {this.state.device.isOperating() && "Saving..."}
                    <select ref="select">
                        {this.state.deviceCollection.map(function(d) {
                            return <option>{d.get("hostname")}</option>;
                        })}
                    </select>
                    {this.state.deviceCollection.fetching && "Loading..."}
                    {this.state.deviceCollection.getError() && "AJAX FAIL :("}
                </div>
                <button className="button"
                    onClick={this.handleAdd}>Lisää
                </button>
            </div>
        );
    }

});


module.exports = AddDevice;

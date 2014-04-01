
var React = require("react/addons");
var Promise = require("bluebird");
var _ = require("lodash");
var reactUpdate = React.addons.update;

var KEYS = [
    "uid",
    "description",
    "title",
    "updates"
];

function generateUID(key) {
    key = "uid-" + key;
    var current = parseInt(localStorage[key] || 1, 10);
    current++;
    localStorage[key]  = current;
    return current;
}

function TicketModel(uid) {
    this.uid = uid;

    if (this.uid) this.load();
}

TicketModel.prototype.bindToComponent = function(component) {
    console.log("binding to ", component);
    this._component = component;
};

TicketModel.prototype.save = function() {
    var self = this;
    var ticket = _.pick(this._component.state, KEYS);

    var saving =  Promise.delay(1000).then(function() {
        if (!ticket.uid) ticket.uid = generateUID("ticket");
        localStorage["ticket-" + ticket.uid] = JSON.stringify(ticket);

        return new Promise(function(resolve, reject){
            self.uid = ticket.uid;
            self._component.setState(
                _.extend(ticket, { saving: null }),
                resolve
            );
        });
    });

    this._component.setState({ saving: saving });

    return saving;
};


TicketModel.prototype.addUpdate = function(updates) {
    var self = this;

    updates = [].concat(updates).map(function(update) {
        return reactUpdate(update, { added: {$set: new Date()} });
    });

    return new Promise(function(resolve, reject){
        self._component.setState(
            reactUpdate(self._component.state, {
                updates: {$push: updates}
            }),
            resolve
        );
    }).then(function() {
        if (self.uid) return self.save();
    });
};

TicketModel.prototype.load = function(uid) {
    if (uid) this.uid = uid;
    var self = this;

    if (!this.uid) throw new Error("Cannot load without uid");
    if (!this._component) throw new Error("Cannot load before component is bound with bindToComponent");

    var loading =  Promise.delay(1000).then(function() {
        return JSON.parse(localStorage["ticket-" + self.uid]);
    });

    this._component.setState({ loading: loading });

    return loading.then(function(res) {
        return new Promise(function(resolve, reject){
            res.loading = null;
            self._component.setState(res, resolve);
        });
    });
};

TicketModel.Type = React.PropTypes.shape({
    save: React.PropTypes.func.isRequired,
    load: React.PropTypes.func.isRequired,
    addUpdate: React.PropTypes.func.isRequired
});

module.exports = TicketModel;

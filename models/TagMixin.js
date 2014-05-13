"use strict";

/**
 * @namespace models
 * @class TagMixin
 */
var TagMixin = {

    /**
    * Returns true if the tag is a status tag
    *
    * @method isStatusTag
    * @return {Boolean}
    */
    isStatusTag: function() {
        return this.get("tag").indexOf("status:") === 0;
    },

    /**
    * Get status part of the tag if the tag is status tag
    *
    * @method getStatus
    * @return {String}
    */
    getStatus: function() {
        if (!this.isStatusTag()) throw new Error("not a status tag");
        return this.get("tag").replace(/^status:/, "");
    }

};

module.exports = TagMixin;

"use strict";

var React       = require('react');
var Environment = require('./environment');

/**
 * A container component which captures <a> clicks and, if there's a matching
 * route defined, routes them.
 */
var CaptureClicks = React.createClass({
  displayName: 'CaptureClicks',

  propTypes: {
    component: React.PropTypes.func.isRequired,
    environment: React.PropTypes.object
  },

  getDefaultProps: function() {
    return {
      component: React.DOM.div,
      environment: Environment.defaultEnvironment,
      gotoURL: function(url) {
        // We should really just be allowing the event's default action, be we
        // can't make the decision to do that synchronously.
        window.location.href = url;
      }
    }
  },

  onClick: function(e) {
    if (this.props.onClick) {
      this.props.onClick(e);
    }

    // Ignore canceled events, modified clicks, and right clicks.
    if (e.defaultPrevented) {
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    if (e.button !== 0) {
      return;
    }

    // Get the <a> element.
    var el = e.target;
    while (el && el.nodeName !== 'A') {
      el = el.parentNode;
    }

    // Ignore clicks from non-a elements.
    if (!el) {
      return;
    }

    // Ignore the click if the element has a target.
    if (el.target && el.target !== '_self') {
      return;
    }

    // Ignore the click if it's a download link. (We use this method of
    // detecting the presence of the attribute for old IE versions.)
    if (!!el.attributes.download) {
      return;
    }

    // Ignore links that don't share a protocol and host with ours.
    if (el.protocol !== window.location.protocol ||
        el.host !== window.location.host) {
      return;
    }

    // Ignore 'rel="external"' links.
    if (el.rel && /(?:^|\s+)external(?:\s+|$)/.test(el.rel)) {
      return;
    }

    var pathname = el.pathname;
    if (el.pathname.charAt(0) !== '/') {
      // Make sure IE has a leading slash.
      pathname = '/' + pathname;
    }

    e.preventDefault();

    // flag if we already found a "not found" case and bailed
    var bail = false;

    var onBeforeNavigation = function(path, navigation) {
      if (bail) {
        return false;
      } else if (!navigation.match || !navigation.match.match) {
        bail = true;
        this.props.gotoURL(el.href);
        return false;
      }
    }.bind(this);

    this.props.environment.navigate(
      pathname,
      {onBeforeNavigation: onBeforeNavigation},
      function(err, info) {
        if (err) {
          throw err;
        }
      });
  },

  render: function() {
    var props = {
      onClick: this.onClick
    };
    return this.transferPropsTo(this.props.component(props, this.props.children));
  }

});

module.exports = CaptureClicks;
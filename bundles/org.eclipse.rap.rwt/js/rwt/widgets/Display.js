/*******************************************************************************
 * Copyright (c) 2011, 2023 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

namespace( "rwt.widgets" );

rwt.widgets.Display = function( properties ) {
  this._document = rwt.widgets.base.ClientDocument.getInstance();
  this._connection = rwt.remote.Connection.getInstance();
  if( properties ) {
    this._startupParameters = properties.startupParameters;
  }
  this._exitConfirmation = null;
  this._hasResizeListener = false;
  this._sendResizeDelayed = false;
  this._disableShutdownRequest = false;
  this._initialized = false;
  if( rwt.widgets.Display._current !== undefined ) {
    throw new Error( "Display can not be created twice" );
  } else {
    rwt.widgets.Display._current = this;
  }
};

rwt.widgets.Display.getCurrent = function() {
  return rwt.widgets.Display._current;
};


rwt.widgets.Display._onAppearFocus = function() {
  var widget = this;
  widget.focus();
  widget.removeEventListener( "appear", rwt.widgets.Display._onAppearFocus, widget );
};

rwt.widgets.Display.prototype = {

  applyObjectId : function() {
    if( !this._initialized ) {
      this.init();
    }
  },

  init : function() {
    this._appendWindowSize();
    this._appendSystemDPI();
    this._appendColorDepth();
    this._appendInitialHistoryEvent();
    this._appendTimezoneOffset();
    this._appendUserPreferences();
    this._appendStartupParameters();
    this._attachListener();
    this._connection.send();
    this._initialized = true;
  },

  allowEvent : function() {
    // NOTE : in the future might need a parameter if there are multiple types of cancelable events
    rwt.remote.KeyEventSupport.getInstance().allowEvent();
  },

  cancelEvent : function() {
    rwt.remote.KeyEventSupport.getInstance().cancelEvent();
  },

  beep : function() {
    // do nothing for now, used by native clients
  },

  setOverflow : function( overflow ) {
    if( overflow === "scroll" || overflow === "scrollX" || overflow === "scrollY" ) {
      this._document.setOverflow( overflow );
    }
  },

  /**
   * An exit confirmation dialog will be displayed if the given message is not
   * null. If the message is empty, the dialog will be displayed but without a
   * message.
   */
  setExitConfirmation : function( message ) {
    this._exitConfirmation = message;
  },

  setFocusControl : function( widgetId ) {
    var widget = rwt.remote.ObjectRegistry.getObject( widgetId );
    if( widget.isSeeable() ) {
      setTimeout( function() { // Delay focusing, see bug 497098
        widget.focus();
      }, 0 );
    } else {
      widget.addEventListener( "appear", rwt.widgets.Display._onAppearFocus, widget );
    }
  },

  setMnemonicActivator : function( value ) {
    rwt.widgets.util.MnemonicHandler.getInstance().setActivator( value );
  },

  setEnableUiTests : function( value ) {
    rwt.widgets.base.Widget._renderHtmlIds = value;
  },

  setDisableShutdownRequest : function( value ) {
    this._disableShutdownRequest = value;
  },

  getDPI : function() {
    var result = [ 0, 0 ];
    if( typeof screen.systemXDPI == "number" ) {
      result[ 0 ] = parseInt( screen.systemXDPI, 10 );
      result[ 1 ] = parseInt( screen.systemYDPI, 10 );
    } else {
      var testElement = document.createElement( "div" );
      testElement.style.width = "1in";
      testElement.style.height = "1in";
      testElement.style.padding = 0;
      document.body.appendChild( testElement );
      result[ 0 ] = parseInt( testElement.offsetWidth, 10 );
      result[ 1 ] = parseInt( testElement.offsetHeight, 10 );
      document.body.removeChild( testElement );
    }
    return result;
  },

  setHasResizeListener : function( value ) {
    this._hasResizeListener = value;
  },

  ////////////////////////
  // Global Event handling

  _attachListener : function() {
    this._document.addEventListener( "windowresize", this._onResize, this );
    this._document.addEventListener( "keypress", this._onKeyPress, this );
    this._connection.addEventListener( "send", this._onSend, this );
    rwt.remote.KeyEventSupport.getInstance(); // adds global KeyListener
    rwt.runtime.System.getInstance().addEventListener( "beforeunload", this._onBeforeUnload, this );
    rwt.runtime.System.getInstance().addEventListener( "unload", this._onUnload, this );
    this._attachUserPreferenceListener();
  },

  /**
   * Watches the display preferences the operating system exposes to the browser. A change of the
   * color scheme also repaints the widgets: the theme resolves its default values through css
   * custom properties, so a stylesheet with a prefers-color-scheme block has a new answer to give
   * as soon as the query flips.
   */
  _attachUserPreferenceListener : function() {
    if( typeof window.matchMedia === "undefined" ) {
      return;
    }
    var that = this;
    var onChange = function() {
      that._appendUserPreferences();
      rwt.theme.ThemeStore.getInstance().refresh();
      that._connection.sendDelayed( 100 );
    };
    var queries = [ window.matchMedia( "(prefers-color-scheme: dark)" ),
                    window.matchMedia( "(prefers-reduced-motion: reduce)" ) ];
    for( var i = 0; i < queries.length; i++ ) {
      if( queries[ i ].addEventListener ) {
        queries[ i ].addEventListener( "change", onChange );
      }
    }
  },

  _onResize : function() {
    this._appendWindowSize();
    if( this._hasResizeListener && !this._sendResizeDelayed ) {
      this._sendResizeDelayed = true;
      this._connection.sendDelayed( 500 );
    }
  },

  _onKeyPress : function( evt ) {
    if( evt.getKeyIdentifier() == "Escape" ) {
      evt.preventDefault();
    }
  },

  _onSend : function() {
    // TODO [tb] : This will attach the cursorLocation as the last operation, but should be first
    var pageX = rwt.event.MouseEvent.getPageX();
    var pageY = rwt.event.MouseEvent.getPageY();
    var location = [ Math.round( pageX ), Math.round( pageY ) ];
    var remoteObject = this._connection.getRemoteObject( this );
    remoteObject.set( "cursorLocation", location );
    if( this._bounds ) {
      remoteObject.set( "bounds", this._bounds );
      delete this._bounds;
    }
    if( this._sendResizeDelayed ) {
      this._sendResizeDelayed = false;
      remoteObject.notify( "Resize" );
    }
  },

  _onBeforeUnload : function( event ) {
    if( this._exitConfirmation !== null && this._exitConfirmation !== "" ) {
      event.getDomEvent().returnValue = this._exitConfirmation;
      event.setUserData( "returnValue", this._exitConfirmation );
    }
  },

  _onUnload : function() {
    this._document.removeEventListener( "windowresize", this._onResize, this );
    this._document.removeEventListener( "keypress", this._onKeyPress, this );
    this._connection.removeEventListener( "send", this._onSend, this );
    rwt.client.ServerPush.getInstance().setActive( false );
    this._connection.getMessageWriter().appendHead( "shutdown", true );
    if( !this._disableShutdownRequest ) {
      this._sendShutdown();
    }
  },

  ///////////////////
  // client to server

  // A synchronous request on unload is ignored by browsers now, and sendBeacon is exactly the
  // API for this: it is the way out for every engine, with the old request left as a fallback
  // for a browser that somehow lacks it.
  _sendShutdown : function() {
    if( navigator.sendBeacon ) {
      this._connection.sendBeacon();
    } else {
      this._connection.sendImmediate( true );
    }
  },

  _appendWindowSize : function() {
    this._bounds = [ 0, 0, window.innerWidth, window.innerHeight ];
  },

  _appendSystemDPI : function() {
    var dpi = this.getDPI();
    this._connection.getRemoteObject( this ).set( "dpi", dpi );
  },

  _appendColorDepth : function() {
    var depth = 16;
    if( typeof screen.colorDepth == "number" ) {
      depth = parseInt( screen.colorDepth, 10 );
    }
    if( rwt.client.Client.isGecko() ) {
      // Firefox detects 24bit and 32bit as 24bit, but 32bit is more likely
      depth = depth == 24 ? 32 : depth;
    }
    this._connection.getRemoteObject( this ).set( "colorDepth", depth );
  },

  _appendInitialHistoryEvent : function() {
    var state = window.location.hash;
    if( state !== "" ) {
      var type = "rwt.client.BrowserNavigation";
      var history = rwt.client.BrowserNavigation.getInstance();
      var handler = rwt.remote.HandlerRegistry.getHandler( type );
      // TODO: Temporary workaround for 388835
      rwt.remote.ObjectRegistry.add( type, history, handler );
      this._connection.getRemoteObject( history ).notify( "Navigation", {
        "state" : decodeURIComponent( state.substr( 1 ) )
      } );
    }
  },

  _appendTimezoneOffset : function() {
    var timezoneOffset = rwt.client.Client.getTimezoneOffset();
    var writer = this._connection.getMessageWriter();
    writer.appendSet( "rwt.client.ClientInfo", "timezoneOffset", timezoneOffset );
  },

  _appendUserPreferences : function() {
    if( typeof window.matchMedia === "undefined" ) {
      return;
    }
    var dark = window.matchMedia( "(prefers-color-scheme: dark)" ).matches;
    var reducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    var writer = this._connection.getMessageWriter();
    writer.appendSet( "rwt.client.ClientInfo", "colorScheme", dark ? "dark" : "light" );
    writer.appendSet( "rwt.client.ClientInfo", "reducedMotion", reducedMotion );
  },

  _appendStartupParameters : function() {
    if( this._startupParameters ) {
      var parameters = rwt.runtime.System.getInstance()._parseQueryString( this._startupParameters );
      var writer = this._connection.getMessageWriter();
      writer.appendSet( "rwt.client.StartupParameters", "parameters", parameters );
    }
  }

};

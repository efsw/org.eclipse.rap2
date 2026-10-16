/*******************************************************************************
 * Copyright (c) 2007, 2016 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 ******************************************************************************/

rwt.qx.Class.define( "rwt.widgets.Browser", {

  extend : rwt.widgets.base.Iframe,

  construct : function() {
    this.base( arguments );
    this._browserFunctions = {};
    this._deferredCalls = [];
    this._deferredCallsTimer = null;
    // TODO [rh] preliminary workaround to make Browser accessible by tab
    this.setTabIndex( 1 );
    this.setSelectable( true );
    this.setAppearance( "browser" );
    this.addEventListener( "create", this._onCreate, this );
  },

  properties : {

    asynchronousResult : {
      check : "Boolean",
      init : false
    },

    executedFunctionPending : {
      check : "Boolean",
      init : false
    },

    executedFunctionResult : {
      nullable : true,
      init : null
    },

    executedFunctionError : {
      check : "String",
      nullable : true,
      init : null
    }

  },

  statics : {

    // una coda piu' lunga di cosi' vuol dire che il server non risponde: le chiamate piu' vecchie
    // si scartano, perche' nessuno le sta aspettando
    MAX_DEFERRED_CALLS : 100,

    getDomain : function( url ) {
      var domain = null;
      if( url !== null ) {
        var lowerCaseUrl = url.toLowerCase();
        // Accepted limitation: In case of other protocls this detection fails.
        var defaultPort;
        if( lowerCaseUrl.indexOf( "http://" ) === 0 ) {
          defaultPort = 80;
        } else if( lowerCaseUrl.indexOf( "https://" ) === 0 ) {
          defaultPort = 443;
        } else if( lowerCaseUrl.indexOf( "ftp://" ) === 0 ) {
          defaultPort = 21;
        } else if( lowerCaseUrl.indexOf( "ftps://" ) === 0 ) {
          defaultPort = 990;
        }
        if( defaultPort ) {
          domain = lowerCaseUrl.slice( lowerCaseUrl.indexOf( "://" ) + 3 );
          var pathStart = domain.indexOf( "/" );
          if( pathStart !== -1 ) {
            domain = domain.slice( 0, pathStart );
          }
          if( domain.indexOf( ":" ) === -1 ) {
            domain += ":" + defaultPort;
          }
        }
      }
      return domain;
    }

  },

  members : {

    syncSource : function() {
      if( this.isCreated() ) {
        this._syncSource();
      }
    },

    // overwritten
    _applySource : function() {
      // server syncs manually
    },

    // overwritten
    _applyEnabled : function( value, oldValue ) {
      this.base( arguments, value, oldValue );
      if( value ) {
        this.release();
      } else {
        this.block();
      }
    },

    // overwritten
    release : function() {
      if( this.getEnabled() ) {
        this.base( arguments );
      }
    },

    _onload : function( evt ) {
      // syncSource in destroy may cause unwanted load event when widget is about to be disposed
      if( !this._isInGlobalDisposeQueue && !this.isDisposed() ) {
        this.base( arguments, evt );
        if( this._isContentAccessible() ) {
          this._attachBrowserFunctions();
        }
        this._sendProgressEvent();
      }
    },

    _onCreate : function() {
      if( !this.getEnabled() ) {
        this.block();
      }
    },

    _sendProgressEvent : function() {
      // The IFrame destroy method does not mark the widget as disposed (or in dispose) immediately,
      // and getRemoteObject can fail if the widget has already been removed from ObjectRegistry
      if( rwt.remote.ObjectRegistry.containsObject( this ) ) {
        rwt.remote.Connection.getInstance().getRemoteObject( this ).notify( "Progress" );
      }
    },

    // Running source written by the server is what "eval" is for, and a content security policy
    // without 'unsafe-eval' forbids exactly that. The same thing is said as a call - a name and
    // arguments, resolved against the document - so there is nothing left here to run.
    execute : function() {
      if( window.console && window.console.error ) {
        window.console.error( "Browser#evaluate is disabled: use Browser#call instead." );
      }
      this._sendEvaluationResult( false, null );
    },

    // Calls a function of the document by name, with arguments that travelled as JSON values.
    // Nothing that arrives here is read as source code, so this is the path that works under a
    // content security policy without "unsafe-eval".
    callFunction : function( name, args ) {
      this._checkIframeAccess();
      var success = true;
      var result = null;
      try {
        result = this._parseEvalResult( this._applyFunction( name, args ) );
      } catch( ex ) {
        success = false;
      }
      this._sendEvaluationResult( success, result );
    },

    // Resolves a name, dots included ("chart.refresh"), against the document and applies the
    // function to the object that holds it: "this" then means inside the call what it means when
    // the document calls the function itself.
    _applyFunction : function( name, args ) {
      var holder = this.getContentWindow();
      var func = holder;
      var parts = name.split( "." );
      for( var i = 0; i < parts.length; i++ ) {
        holder = func;
        func = holder[ parts[ i ] ];
        if( func == null ) {
          throw new Error( "Unknown function \"" + name + "\"." );
        }
      }
      if( typeof func !== "function" ) {
        throw new Error( "\"" + name + "\" is not a function." );
      }
      return func.apply( holder, args ? args : [] );
    },

    _sendEvaluationResult : function( success, result ) {
      var connection = rwt.remote.Connection.getInstance();
      var id = rwt.remote.ObjectRegistry.getId( this );
      var method = success ? "evaluationSucceeded" : "evaluationFailed";
      var properties = success ? { "result" : result } : {};
      connection.getMessageWriter().appendCall( id, method, properties );
      if( this.getExecutedFunctionPending() ) {
        connection.sendImmediate( false );
      } else {
        connection.send();
      }
    },

    _srcInLocalDomain : function() {
      var src = this.getSource();
      var statics = rwt.widgets.Browser;
      var localDomain = statics.getDomain( document.URL );
      var srcDomain = statics.getDomain( src );
      var isSameDomain = localDomain === srcDomain;
      var isRelative = srcDomain === null;
      return isRelative || isSameDomain;
    },

    _isContentAccessible : function() {
      if( !this._isLoaded ) {
        return false;
      }
      var accessible = false;
      try {
        var src = this.getSource() || "";
        src = src.split( "?" )[ 0 ];
        if( src.indexOf( "://" ) === -1 ) { // relative path?
          src = document.URL; // works since we only check that the domain matches
        }
        accessible = src.indexOf( this.getContentDocument().domain ) !== -1;
      } catch( ex ) {
        // ignore
      }
      return accessible;
    },

    _checkIframeAccess : function() {
      if( !this._isContentAccessible() ) {
        var isSameDomain = this._srcInLocalDomain();
        if( !isSameDomain ) {
          this._throwSecurityException( false );
        }
        if( this._isLoaded && isSameDomain ) {
          // not accessible when it appears it should be
          // => user navigated to external site.
          this._throwSecurityException( true );
        }
      }
    },

    _throwSecurityException : function( domainUnkown ) {
      var statics = rwt.widgets.Browser;
      var localDomain = statics.getDomain( document.URL );
      var srcDomain = domainUnkown ? null : statics.getDomain( this.getSource() );
      var msg = "SecurityRestriction:\nBrowser-Widget can not access ";
      msg +=   srcDomain !== null
             ? "\"" + srcDomain + "\""
             : "unkown domain";
      msg += " from \"" + localDomain + "\".";
      throw new Error( msg );
    },

    _parseEvalResult : function( value ) {
      var result = null;
      var win = this.getContentWindow();
      // NOTE: This mimics the behavior of the evaluate method in SWT:
      if( value instanceof win.Function || value instanceof Function ) {
        result = this.toJSON( [ [] ] );
      } else if( value instanceof win.Array || value instanceof Array ) {
        result = this.toJSON( [ value ] );
      } else if( typeof value !== "object" && typeof value !== "function" ) {
        // above: some browser say regular expressions of the type "function"
        result = this.toJSON( [ value ] );
      }
      return result;
    },

    createFunction : function( name, deferred ) {
      this._browserFunctions[ name ] = deferred === true;
      this._checkIframeAccess();
      if( this.isLoaded() ) {
        try {
          this._createFunctionImpl( name );
          this._createFunctionWrapper( name, deferred === true );
        } catch( e ) {
          var msg = "Unable to create function: \"" + name + "\".\n" + e;
          if( rwt.remote.EventUtil.getSuspended() ) {
            throw msg;
          } else {
            rwt.runtime.ErrorHandler.processJavaScriptError( msg );
          }
        }
      }
    },

    _attachBrowserFunctions : function() {
      // NOTE: In case the user navigates to a page outside the domain,
      // this function will not be triggered due to the lack of a loading event.
      // That also means that this is the only case were creating a browser
      // function in a cross-domain scenario silently fails.
      // the page is another one now: the calls still queued belong to the one before it
      this._deferredCalls = [];
      for( var name in this._browserFunctions ) {
        this.createFunction( name, this._browserFunctions[ name ] );
      }
    },

    _createFunctionImpl : function( name ) {
      var win = this.getContentWindow();
      var connection = rwt.remote.Connection.getInstance();
      var id = rwt.remote.ObjectRegistry.getId( this );
      var that = this;
      win[ name + "_impl" ] = function() {
        var result = {};
        try {
          if( that.getExecutedFunctionPending() ) {
            result.error = "Unable to execute browser function \""
              + name
              + "\". Another browser function is still pending.";
          } else {
            var properties = {
              "name" : name,
              "arguments" : that.toJSON( arguments )
            };
            connection.getMessageWriter().appendCall( id, "executeFunction", properties );
            that.setExecutedFunctionResult( null );
            that.setExecutedFunctionError( null );
            that.setExecutedFunctionPending( true );
            that.setAsynchronousResult( false );
            connection.sendImmediate( false );
            if( that.getExecutedFunctionPending() ) {
              that.setAsynchronousResult( true );
            } else {
              var error = that.getExecutedFunctionError();
              if( error != null ) {
                result.error = error;
              } else {
                result.result = that.getExecutedFunctionResult();
              }
            }
          }
        } catch( ex ) {
          rwt.runtime.ErrorHandler.processJavaScriptError( ex );
        }
        return result;
      };
    },

    // [if] This wrapper function is a workaround for bug 332313
    _createFunctionWrapper : function( name, deferred ) {
      var win = this.getContentWindow();
      var impl = win[ name + "_impl" ];
      var that = this;
      win[ name ] = function() {
        if( deferred ) {
          that._callDeferred( impl, arguments );
          return undefined;
        }
        var result = impl.apply( win, arguments );
        if( result.error ) {
          // the document's own Error, as the wrapper built by eval used to raise: code in the page
          // that tests the failure against Error keeps recognizing it
          var ErrorType = win.Error || Error;
          throw new ErrorType( result.error );
        }
        return result.result;
      };
    },

    /*
     * A browser function is a SYNCHRONOUS request. The client holds back an asynchronous request
     * while another one is in flight, but it sends a synchronous one anyway, with the next
     * counter: the server receives it out of sequence, answers with an invalid request counter,
     * and the session never realigns. A click, a map event or a key pressed while the application
     * is refreshing a form is enough.
     *
     * A function declared deferred gives the page nothing back, so it can wait: its calls are
     * queued and leave in the order they arrived, as soon as the connection is free.
     */
    _callDeferred : function( impl, args ) {
      var callArguments = Array.prototype.slice.call( args );
      if( this._deferredCalls.length === 0 && !this._isRequestPending() ) {
        var result = impl.apply( this.getContentWindow(), callArguments );
        if( !result || !result.error ) {
          return;
        }
        // another browser function is still running: this call waits in the queue like the others
      }
      if( this._deferredCalls.length >= rwt.widgets.Browser.MAX_DEFERRED_CALLS ) {
        this._deferredCalls.shift();
      }
      this._deferredCalls.push( { "impl" : impl, "args" : callArguments, "tries" : 0 } );
      this._scheduleDeferredCalls( 0 );
    },

    _scheduleDeferredCalls : function( delay ) {
      if( this._deferredCallsTimer !== null ) {
        return;
      }
      var that = this;
      this._deferredCallsTimer = window.setTimeout( function() {
        that._deferredCallsTimer = null;
        that._flushDeferredCalls();
      }, delay );
    },

    _flushDeferredCalls : function() {
      if( this.isDisposed() || !this._isContentAccessible() ) {
        return;
      }
      while( this._deferredCalls.length > 0 ) {
        if( this._isRequestPending() ) {
          this._scheduleDeferredCalls( 30 );
          return;
        }
        var item = this._deferredCalls.shift();
        var result = item.impl.apply( this.getContentWindow(), item.args );
        if( result && result.error ) {
          // another browser function is still running: try again for a while, then the call is
          // dropped - the session is not
          item.tries++;
          if( item.tries < 5 ) {
            this._deferredCalls.unshift( item );
            this._scheduleDeferredCalls( 100 );
            return;
          }
        }
      }
    },

    _isRequestPending : function() {
      return rwt.remote.Connection.getInstance()._requestPending === true;
    },

    destroyFunction :function( name ) {
      delete this._browserFunctions[ name ];
      var win = this.getContentWindow();
      if( win != null ) {
        try {
          delete win[ name ];
          delete win[ name + "_impl" ];
        } catch( e ) {
          throw new Error( "Unable to destroy function: " + name + " error: " + e );
        }
      }
    },

    setFunctionResult : function( name, result, error ) {
      this.setExecutedFunctionResult( result );
      this.setExecutedFunctionError( error );
      this.setExecutedFunctionPending( false );
    },

    toJSON : function( object ) {
      var result;
      var type = typeof object;
      if( object === null ) {
        result = object;
      } else if( type === "object" ) {
        result = [];
        for( var i = 0; i < object.length; i++ ) {
          result.push( this.toJSON( object[ i ] ) );
        }
      } else if( type === "function" ) {
        result = String( object );
      } else {
        result = object;
      }
      return result;
    },

    destroy : function() {
      this.base( arguments );
      // Needed for IE dipose fix in Iframe.js because _applySource is overwritten in Browser.js
      this.syncSource();
    }

  }

} );

/*******************************************************************************
 * Copyright (c) 2014, 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

rwt.qx.Mixin.define( "rwt.widgets.util.HtmlAttributesMixin", {

  destruct : function() {
    delete this._htmlAttributes;
    delete this._serverHtmlAttributes;
    delete this._inlineStyleProperties;
  },

  members : {

    applyObjectId : function( id ) {
      if( rwt.widgets.base.Widget._renderHtmlIds ) {
        this.setHtmlAttribute( "id", id );
      }
    },

    clearHtmlAttributes : function() {
      if( !this._htmlAttributes ) {
        return;
      }
      if( this._element ) {
        for( var attribute in this._htmlAttributes ) {
          if( attribute !== "class" && attribute !== "style" ) {
            this._element.removeAttribute( attribute );
          }
        }
        this._applyInlineStyle( this._element, "" );
      }
      this._htmlAttributes = {};
      if( this._renderCssClasses ) {
        this._renderCssClasses();
      }
    },

    setHtmlAttributes : function( map ) {
      for( var key in map ) {
        this.setHtmlAttribute( key, map[ key ] );
      }
    },

    /**
     * Applies the set of attributes given by the server. Attributes that were part of a
     * previous call but are missing now are removed, while attributes set by the widget
     * itself - the ARIA attributes for instance - are left untouched.
     */
    setServerHtmlAttributes : function( map ) {
      var previous = this._serverHtmlAttributes;
      if( previous ) {
        for( var i = 0; i < previous.length; i++ ) {
          if( !map || !( previous[ i ] in map ) ) {
            this.setHtmlAttribute( previous[ i ], null );
          }
        }
      }
      var names = [];
      for( var key in map ) {
        names.push( key );
        this.setHtmlAttribute( key, map[ key ] );
      }
      this._serverHtmlAttributes = names;
    },

    setHtmlAttribute : function( attribute, value ) {
      if( this._storeHtmlAttribute( attribute, value ) && this._update ) {
        this._update();
      }
    },

    /**
     * Stores an attribute and applies it to the element, without scheduling an update of the
     * widget content. Returns true if the stored value has changed.
     *
     * Two attributes are stored but never written directly. The "class" attribute is rendered by
     * rwt.widgets.base.Widget#_renderCssClasses, which appends this value to the generated class
     * names instead of replacing them. The "style" attribute is applied one declaration at a time
     * by #_applyInlineStyle - see there for the reason.
     */
    _storeHtmlAttribute : function( attribute, value ) {
      var normalized = value === undefined ? null : value;
      var indirect = attribute === "class" || attribute === "style";
      if( !this._htmlAttributes && normalized === null ) {
        return false;
      } else if( !this._htmlAttributes ) {
        this._htmlAttributes = {};
      }
      if( this._htmlAttributes[ attribute ] === normalized ) {
        return false;
      }
      if( normalized === null ) {
        delete this._htmlAttributes[ attribute ];
        if( this._element && !indirect ) {
          this._element.removeAttribute( attribute );
        }
      } else {
        this._htmlAttributes[ attribute ] = normalized;
        if( this._element && !indirect ) {
          this._element.setAttribute( attribute, normalized );
        }
      }
      if( attribute === "class" && this._renderCssClasses ) {
        this._renderCssClasses();
      }
      if( attribute === "style" && this._element ) {
        this._applyInlineStyle( this._element, normalized === null ? "" : normalized );
      }
      return true;
    },

    /**
     * Applies the declarations of a "style" attribute to the element one at a time, instead of
     * writing the attribute itself.
     *
     * Writing it would replace the entire cssText of the element, and the layout engine keeps the
     * position and the size of the widget in there - written directly on element.style and not
     * restored afterwards, so the widget would end up in the top left corner with no size.
     *
     * Declarations that were part of a previous value and are missing now are removed; every other
     * property of the element is left alone. Note that a property the theme also writes is not
     * safe here: whoever writes last wins, and "!important" does not help, because assigning a
     * property through the CSSOM drops the priority of the previous declaration. Custom properties
     * are the reliable way in: the theme never writes those.
     */
    _applyInlineStyle : function( element, value ) {
      var previous = this._inlineStyleProperties;
      if( !previous && !value ) {
        return;
      }
      var declarations = this._parseCssDeclarations( value );
      var names = [];
      var i;
      for( i = 0; i < declarations.length; i++ ) {
        names.push( declarations[ i ][ 0 ] );
      }
      if( previous ) {
        for( i = 0; i < previous.length; i++ ) {
          if( names.indexOf( previous[ i ] ) === -1 ) {
            element.style.removeProperty( previous[ i ] );
          }
        }
      }
      for( i = 0; i < declarations.length; i++ ) {
        element.style.setProperty( declarations[ i ][ 0 ], declarations[ i ][ 1 ], declarations[ i ][ 2 ] );
      }
      this._inlineStyleProperties = names.length > 0 ? names : null;
    },

    /**
     * Writes the inline style declarations again, over what has just been written by someone else.
     * <p>
     * The one who needs this is the appearance: when a state changes it writes its own properties,
     * and writing a background colour rebuilds the whole "background" shorthand from the style
     * bookkeeping - taking away any background image, which is how a dot, an icon or a gauge is
     * drawn. Whoever writes last wins, so the declarations are written after.
     * </p>
     * <p>
     * Costs nothing on a widget without a style attribute, which is the normal case: there is
     * nothing to parse and nothing to write.
     * </p>
     */
    _reapplyInlineStyle : function() {
      if( this._element && this._htmlAttributes && this._htmlAttributes[ "style" ] ) {
        this._applyInlineStyle( this._element, this._htmlAttributes[ "style" ] );
      }
    },

    /**
     * Splits a css declaration list into [ name, value, priority ] triples.The parsing is left to
     * the browser - on a detached element, so that nothing of the widget is touched - because a
     * split on ";" would break on url() and on quoted values.
     */
    _parseCssDeclarations : function( value ) {
      var result = [];
      if( !value ) {
        return result;
      }
      var probe = document.createElement( "div" );
      probe.style.cssText = value;
      for( var i = 0; i < probe.style.length; i++ ) {
        var name = probe.style.item( i );
        result.push( [
          name,
          probe.style.getPropertyValue( name ),
          probe.style.getPropertyPriority( name )
        ] );
      }
      return result;
    },

    getHtmlAttribute : function( attribute ) { // not used in RWT, but in tests and add-ons
      return this.getHtmlAttributes()[ attribute ] || "";
    },

    getHtmlAttributes : function() {
      return this._htmlAttributes || {}; // NOT a save copy!
    }

  }

} );

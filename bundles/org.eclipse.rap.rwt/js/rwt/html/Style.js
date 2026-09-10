/*******************************************************************************
 * Copyright: 2004, 2015 1&1 Internet AG, Germany, http://www.1und1.de,
 *                       and EclipseSource
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0 which accompanies this
 * distribution, and is available at http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    1&1 Internet AG and others - original API and implementation
 *    EclipseSource - adaptation for the Eclipse Remote Application Platform
 *
 *   This class contains code based on the following work:
 *
 *   * Prototype JS
 *     http://www.prototypejs.org/
 *     Version 1.5
 *
 *     Copyright:
 *       (c) 2006-2007, Prototype Core Team
 *
 *     License:
 *       MIT: http://www.opensource.org/licenses/mit-license.php
 *
 *     Authors:
 *       * Prototype Core Team
 *
 ******************************************************************************/

(function() {

var Client = rwt.client.Client;

/**
 * Style querying and modification of HTML elements.
 *
 * Automatically normalizes cross-browser differences. Optimized for
 * performance.
 */
rwt.qx.Class.define( "rwt.html.Style", {

  statics : {

    getStyleProperty : function( element, name ) {
      try {
        var doc = rwt.html.Nodes.getDocument( element );
        var computed = doc.defaultView.getComputedStyle( element, null );
        var result = computed ? computed[ name ] : null;
        return result ? result : element.style[ name ];
      } catch( ex ) {
        throw new Error("Could not evaluate computed style: " + element + "[" + name + "]: " + ex);
      }
    },

    setStyleProperty : function( target, property, value ) {
      if( target.setStyleProperty ) {
        target.setStyleProperty( property, value );
      } else {
        target.style[ property ] = value;
      }
    },

    removeStyleProperty : function( target, property ) {
      if( target instanceof rwt.widgets.base.Widget ) {
        target.removeStyleProperty( property );
      } else {
        target.style[ property ] = "";
      }
    },

    getOwnProperty : function( target, property ) {
      if( target.getStyleProperty ) {
        target.getStyleProperty( property );
      } else {
        return target.style[ property ];
      }
    },

    /**
     * Get a (CSS) style property of a given DOM element and interpret the property as integer value
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @param propertyName {String} the name of the style property. e.g. "paddingTop", "marginLeft", ...
     * @return {Integer} the (CSS) style property converted to an integer value
     */
    getStyleSize : function(vElement, propertyName) {
      return parseInt( rwt.html.Style.getStyleProperty( vElement, propertyName ), 10 ) || 0;
    },


    /**
     * Get the element's left margin.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's left margin size
     */
    getMarginLeft : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "marginLeft");
    },


    /**
     * Get the element's top margin.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's top margin size
     */
    getMarginTop : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "marginTop");
    },


    /**
     * Get the element's right margin.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's right margin size
     */
    getMarginRight : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "marginRight");
    },


    /**
     * Get the element's bottom margin.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's bottom margin size
     */
    getMarginBottom : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "marginBottom");
    },


    /**
     * Get the element's left padding.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's left padding size
     */
    getPaddingLeft : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "paddingLeft");
    },


    /**
     * Get the element's top padding.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's top padding size
     */
    getPaddingTop : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "paddingTop");
    },


    /**
     * Get the element's right padding.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's right padding size
     */
    getPaddingRight : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "paddingRight");
    },


    /**
     * Get the element's bottom padding.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's bottom padding size
     */
    getPaddingBottom : function(vElement) {
      return rwt.html.Style.getStyleSize(vElement, "paddingBottom");
    },


    /**
     * Get the element's left border width.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's left border width
     */
    getBorderLeft : function(vElement) {
      return rwt.html.Style.getStyleProperty(vElement, "borderLeftStyle") == "none" ? 0 : rwt.html.Style.getStyleSize(vElement, "borderLeftWidth");
    },


    /**
     * Get the element's top border width.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's top border width
     */
    getBorderTop : function(vElement) {
      return rwt.html.Style.getStyleProperty(vElement, "borderTopStyle") == "none" ? 0 : rwt.html.Style.getStyleSize(vElement, "borderTopWidth");
    },


    /**
     * Get the element's right border width.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's right border width
     */
    getBorderRight : function(vElement) {
      return rwt.html.Style.getStyleProperty(vElement, "borderRightStyle") == "none" ? 0 : rwt.html.Style.getStyleSize(vElement, "borderRightWidth");
    },

    /**
     * Get the element's bottom border width.
     *
     * @type static
     * @param vElement {Element} the DOM element
     * @return {Integer} the element's bottom border width
     */
    getBorderBottom : function(vElement) {
      return rwt.html.Style.getStyleProperty(vElement, "borderBottomStyle") == "none" ? 0 : rwt.html.Style.getStyleSize(vElement, "borderBottomWidth");
    },

    /**
     * Sets the given gradient as a background for the target element/widget.
     * The syntax is [ [ position, color ]* ], with position <= 1 and >= 0.
     * Color is any valid css string for colors.
     * The position has to increase from every previous position.
     * The gradient flows from top to bottom unless a "horizontal" flag is added as
     * a field to the gradient object, in which case it flows from left to right.
     *
     * If a background color is set, the gradient is rendered on top of it.
     * If a background image is set, the gradient is not rendered until it is removed.
     * If the browser does not support CSS3, the gradient is never rendered.
     */
    setBackgroundGradient : function( target, gradient ) {
      // Tests for identity, not equality, which is okay since this is just an optimization
      if( target.___rwtStyle__backgroundGradient !== gradient ) {
        target.___rwtStyle__backgroundGradient = gradient;
        if( !target.___rwtStyle__backgroundImage ) {
          this._updateBackground( target );
        }
      }
    },

    getBackgroundGradient : function( target ) {
      var gradient = target.___rwtStyle__backgroundGradient;
      if( !gradient ) {
        return undefined;
      }
      var args = [ gradient.horizontal === true ? "to right" : "to bottom" ];
      for( var i = 0; i < gradient.length; i++ ) {
        var position = ( gradient[ i ][ 0 ] * 100 ) + "%";
        var color = gradient[ i ][ 1 ];
        args.push( " " + color + " " + position );
      }
      return "linear-gradient( " + args.join() + " )";
    },

    /**
     * Sets the given image url as a background for the target element/widget.
     * If a background color is set, the image is rendered on top of it.
     * If a background gradient is set, only the image is rendered.
     * For background repeat/position to be respected, they have to be set by
     * setBackgroundPosition/Repeat, never directly.
     */
    setBackgroundImage : function( target, image ) {
      if( target.___rwtStyle__backgroundImage !== image ) {
        target.___rwtStyle__backgroundImage = image;
        this._updateBackground( target );
      }
    },

    getBackgroundImage : function( target ) {
      var image = target.___rwtStyle__backgroundImage;
      if( !image ) {
        return "none";
      }
      return "url(" + image + ")";
    },

    setBackgroundRepeat : function( target, repeat ) {
      if( target.___rwtStyle__backgroundRepeat !== repeat ) {
        target.___rwtStyle__backgroundRepeat = repeat;
        if( target.___rwtStyle__backgroundImage ) {
          this._updateBackground( target );
        }
      }
    },

    getBackgroundRepeat : function( target ) {
      return target.___rwtStyle__backgroundRepeat;
    },

    setBackgroundPosition : function( target, position ) {
      if( target.___rwtStyle__backgroundPosition !== position ) {
        target.___rwtStyle__backgroundPosition = position;
        if( target.___rwtStyle__backgroundImage ) {
          this._updateBackground( target );
        }
      }
    },

    getBackgroundPosition : function( target ) {
      return target.___rwtStyle__backgroundPosition;
    },

    setBackgroundSize : function( target, size ) {
      if( target.___rwtStyle__backgroundSize !== size ) {
        target.___rwtStyle__backgroundSize = size;
        if( target.___rwtStyle__backgroundImage ) {
          this._updateBackground( target );
        }
      }
    },

    /**
     * Sets the given color as a background for the target element/widget.
     * The color is rendered in any case, but always below gradient and image.
     */
    setBackgroundColor : function( target, color ) {
      var value = color === "transparent" ? null : color;
      if( target.___rwtStyle__backgroundColor !== value ) {
        target.___rwtStyle__backgroundColor = value;
        this._updateBackground( target );
      }
    },

    /**
     * Returns the color that was previously set by setBackgroundColor
     */
    getBackgroundColor : function( target ) {
      return target.___rwtStyle__backgroundColor || "transparent";
    },

    setBoxShadow: function( target, shadowObject ) {
      var property = "boxShadow";
      if( shadowObject ) {
        // NOTE: older webkit dont accept spread, therefor only use parameters 1-3
        var string = shadowObject[ 0 ] ? "inset " : "";
        string += shadowObject.slice( 1, 4 ).join( "px " ) + "px";
        var rgba = rwt.util.Colors.stringToRgb( shadowObject[ 5 ] );
        rgba.push( shadowObject[ 6 ] );
        string += " rgba(" + rgba.join() + ")";
        this.setStyleProperty( target, property, string );
      } else {
        this.removeStyleProperty( target, property );
      }
    },

    setTextShadow : function( target, shadowObject ) {
      var property = "textShadow";
      if( shadowObject ) {
        var string = shadowObject.slice( 1, 4 ).join( "px " ) + "px";
        var rgba = rwt.util.Colors.stringToRgb( shadowObject[ 5 ] );
        rgba.push( shadowObject[ 6 ] );
        string += " rgba(" + rgba.join() + ")";
        this.setStyleProperty( target, property, string );
      } else {
        this.removeStyleProperty( target, property );
      }
    },

    setPointerEvents : function( target, value ) {
      this.setStyleProperty( target, "pointerEvents", value );
      target.setAttribute( "pointerEvents", value );
    },

    setUserSelect : function( target, value ) {
      this.setStyleProperty( target, this._resolveProperty( "userSelect" ), value );
    },

    getUserSelect : function( target ) {
      return this.getOwnProperty( target, this._resolveProperty( "userSelect" ) );
    },

    setTransition : function( target, value ) {
      this.setStyleProperty( target, "transition", value );
    },

    //////////
    // Private

    /**
     * Returns the name a style property has to be written under. Everything RWT needs is
     * standard by now with one exception, user-select, which Safari still only knows prefixed;
     * asking the element which name it recognizes is both shorter and more durable than keeping
     * a table of browsers.
     */
    _resolveProperty : function( property ) {
      if( !this._resolvedProperties ) {
        this._resolvedProperties = {};
      }
      var result = this._resolvedProperties[ property ];
      if( result === undefined ) {
        result = property;
        var probe = document.createElement( "div" );
        if( !( property in probe.style ) ) {
          var prefixed = "webkit" + rwt.util.Strings.toFirstUp( property );
          if( prefixed in probe.style ) {
            result = prefixed;
          }
        }
        this._resolvedProperties[ property ] = result;
      }
      return result;
    },

    _updateBackground : function( target ) {
      var background = [];
      this._pushBackgroundImage( target, background );
      this._pushBackgroundGradient( target, background );
      this._pushBackgroundColor( target, background );
      if( background.length > 0 ) {
        this.setStyleProperty( target, "background", background.join( ", " ) );
        // Set background size as separate backgroundSize property for Firefox compatibility
        // http://stackoverflow.com/questions/7864448/background-size-in-shorthand-background-property-css3
        if( target.___rwtStyle__backgroundImage && target.___rwtStyle__backgroundSize ) {
          this.setStyleProperty( target, "backgroundSize", target.___rwtStyle__backgroundSize );
        }
      } else {
        this._clearCssBackground( target );
      }
    },

    _pushBackgroundImage : function( target, backgroundArray ) {
      var value = target.___rwtStyle__backgroundImage;
      if( value ) {
        var repeat = target.___rwtStyle__backgroundRepeat;
        var position = target.___rwtStyle__backgroundPosition;
        backgroundArray.push( this._getImageString( value, repeat, position ) );
      }
    },

    _pushBackgroundGradient : function( target, backgroundArray ) {
      var value = target.___rwtStyle__backgroundGradient;
      if( value && !target.___rwtStyle__backgroundImage ) {
        backgroundArray.push( this._getGradientString( value ) );
      }
    },

    _pushBackgroundColor : function( target, backgroundArray ) {
      var value = target.___rwtStyle__backgroundColor;
      if( value ) {
        if( ( Client.isWebkit() || Client.isBlink() ) && !target.___rwtStyle__backgroundGradient ) {
          backgroundArray.push( this._getGradientString( [ [ 0, value ], [ 1, value ] ] ) );
        }
        backgroundArray.push( value );
      }
    },

    // The standard syntax is understood by every browser RWT targets, so there is one
    // implementation left and _getDefaultGradientString could be inlined here; it is kept
    // apart because the theme store calls it for a single color as well.
    _getGradientString : function( gradientObject ) {
      return this._getDefaultGradientString( gradientObject );
    },

    _getDefaultGradientString : function( gradientObject ) {
      var args = [ gradientObject.horizontal === true ? "90deg" : "180deg" ];
      for( var i = 0; i < gradientObject.length; i++ ) {
        var position = ( gradientObject[ i ][ 0 ] * 100 ) + "%";
        var color = gradientObject[ i ][ 1 ];
        args.push( color + " " + position );
      }
      return "linear-gradient( " + args.join() + ")";
    },

    _getImageString : function( value, repeat, position ) {
      return   "url(" + this._resolveResource( value ) + ")"
             + ( repeat ? " " + repeat : "" )
             + ( position ? " " + position : "" );
    },

    _clearCssBackground : function( target ) {
      this.removeStyleProperty( target, "background" );
    },

    /////////
    // Helper

    _resolveResource : function( url ) {
      return url;
    }

  }

} );

}() );

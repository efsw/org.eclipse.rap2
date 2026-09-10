/*******************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

/**
 * Reads the theme values that a stylesheet of the application has redefined.
 *
 * The server writes the default value of every themeable property as a css custom property on
 * :root - "--rwt-Button-background-color: #ffffff" - in a generated stylesheet that is linked
 * before the stylesheets of the application. A stylesheet that comes later can therefore redefine
 * any of them, in a media query as well, which is how an application gets a dark variant.
 *
 * The value declared by the generated stylesheet is read from the CSSOM, where a later
 * declaration cannot hide it, and compared with the value that actually applies. They differ only
 * if the application has redefined the property; in that case, and only then, the theme store
 * hands out the new value instead of its own.
 *
 * The value is parsed by assigning it to a real css property of a hidden element and reading the
 * computed style back, so anything the browser understands - a named color, rgb(), color-mix() -
 * works without a parser of our own.
 */
rwt.qx.Class.define( "rwt.theme.CssVariables", {

  extend : rwt.qx.Object,

  statics : {

    PREFIX : "--rwt-",

    getInstance : function() {
      return rwt.runtime.Singletons.get( rwt.theme.CssVariables );
    }

  },

  construct : function() {
    this.base( arguments );
    this._declared = null;
    this._resolved = {};
    this._probe = null;
  },

  destruct : function() {
    if( this._probe && this._probe.parentNode ) {
      this._probe.parentNode.removeChild( this._probe );
    }
    this._probe = null;
    this._declared = null;
    this._resolved = null;
  },

  members : {

    /**
     * Forgets everything that was read so far. To be called when the custom properties may have
     * changed - after a switch between the light and the dark variant, for instance. The widgets
     * are not repainted by this: see rap.refreshTheme.
     */
    refresh : function() {
      this._declared = null;
      this._resolved = {};
    },

    getColor : function( element, property ) {
      return this._get( element, property, "color", "color", this._readColor );
    },

    getAlpha : function( element, property ) {
      return this._get( element, property, "color", "color", this._readAlpha );
    },

    getDimension : function( element, property ) {
      return this._get( element, property, "marginTop", "marginTop", this._readDimension );
    },

    getBoxDimensions : function( element, property ) {
      return this._get( element, property, "margin", "marginTop", this._readBoxDimensions );
    },

    getFloat : function( element, property ) {
      return this._get( element, property, "opacity", "opacity", this._readFloat );
    },

    getIdentifier : function( element, property ) {
      return this._get( element, property, null, null, this._readIdentifier );
    },

    getFont : function( element, property ) {
      return this._get( element, property, "font", "fontSize", this._readFont );
    },

    ////////////
    // Internals

    /**
     * Returns the value the application has given to a property, or null when it has not touched
     * it. The result - null included - is cached: reading a custom property means asking for a
     * computed style, which is too expensive to repeat for every widget that renders.
     */
    _get : function( element, property, cssProperty, verifyProperty, reader ) {
      var name = rwt.theme.CssVariables.PREFIX + element + "-" + property;
      var cacheKey = name + "|" + cssProperty;
      if( cacheKey in this._resolved ) {
        return this._resolved[ cacheKey ];
      }
      var result = null;
      var value = this._getOverriddenValue( name );
      if( value !== null ) {
        result = cssProperty === null
               ? reader.call( this, value )
               : this._parse( cssProperty, verifyProperty, value, reader );
      }
      this._resolved[ cacheKey ] = result;
      return result;
    },

    /**
     * Returns the value of a custom property if it differs from the one the generated stylesheet
     * declares, null otherwise.
     */
    _getOverriddenValue : function( name ) {
      var declared = this._getDeclaredValues()[ name ];
      if( declared === undefined ) {
        return null;
      }
      var style = window.getComputedStyle( document.documentElement );
      var actual = style.getPropertyValue( name ).trim();
      return actual === "" || actual === declared ? null : actual;
    },

    /**
     * Collects, from the generated stylesheet, the value every custom property was given there.
     * Stylesheets of other origins throw on cssRules and are skipped; if the generated stylesheet
     * cannot be read at all the map stays empty, and no value is ever treated as overridden -
     * the theme store keeps answering on its own, which is the behaviour without this class.
     */
    _getDeclaredValues : function() {
      if( this._declared === null ) {
        this._declared = {};
        var prefix = rwt.theme.CssVariables.PREFIX;
        var sheets = document.styleSheets;
        for( var i = 0; i < sheets.length; i++ ) {
          var rules = this._getRules( sheets[ i ] );
          for( var j = 0; j < rules.length; j++ ) {
            var style = rules[ j ].style;
            if( style && rules[ j ].selectorText === ":root" ) {
              for( var k = 0; k < style.length; k++ ) {
                var name = style[ k ];
                if( name.indexOf( prefix ) === 0 && !( name in this._declared ) ) {
                  this._declared[ name ] = style.getPropertyValue( name ).trim();
                }
              }
            }
          }
        }
      }
      return this._declared;
    },

    _getRules : function( sheet ) {
      try {
        return sheet.cssRules || [];
      } catch( ex ) {
        return []; // cross origin stylesheet
      }
    },

    /**
     * Lets the browser parse the value, by assigning it to a real css property of a hidden
     * element and reading the computed style back. The property that is verified is not always
     * the one that is set: for a shorthand like "font", reading the shorthand back is not
     * reliable across browsers, while its longhands always are.
     */
    _parse : function( cssProperty, verifyProperty, value, reader ) {
      var probe = this._getProbe();
      probe.style.cssText = "position:absolute;visibility:hidden;top:-1000px;left:-1000px;";
      probe.style[ cssProperty ] = value;
      if( probe.style[ verifyProperty ] === "" ) {
        return null; // not a valid value for this property
      }
      return reader.call( this, window.getComputedStyle( probe ), value );
    },

    _getProbe : function() {
      if( this._probe === null ) {
        this._probe = document.createElement( "div" );
        document.body.appendChild( this._probe );
      }
      return this._probe;
    },

    ///////////
    // Readers

    _readColor : function( style ) {
      var rgba = this._toRgba( style.color );
      if( rgba === null ) {
        return null;
      }
      return rgba[ 3 ] === 0
           ? "transparent"
           : "#" + rwt.util.Colors.rgbToHexString( [ rgba[ 0 ], rgba[ 1 ], rgba[ 2 ] ] );
    },

    _readAlpha : function( style ) {
      var rgba = this._toRgba( style.color );
      return rgba === null ? null : rgba[ 3 ];
    },

    _readDimension : function( style ) {
      var result = parseFloat( style.marginTop );
      return isNaN( result ) ? null : Math.round( result );
    },

    _readBoxDimensions : function( style ) {
      var result = [
        parseFloat( style.marginTop ),
        parseFloat( style.marginRight ),
        parseFloat( style.marginBottom ),
        parseFloat( style.marginLeft )
      ];
      for( var i = 0; i < result.length; i++ ) {
        if( isNaN( result[ i ] ) ) {
          return null;
        }
        result[ i ] = Math.round( result[ i ] );
      }
      return result;
    },

    _readFloat : function( style ) {
      var result = parseFloat( style.opacity );
      return isNaN( result ) ? null : result;
    },

    _readIdentifier : function( value ) {
      return value;
    },

    _readFont : function( style ) {
      var size = parseFloat( style.fontSize );
      if( isNaN( size ) ) {
        return null;
      }
      var font = new rwt.html.Font();
      font.setSize( Math.round( size ) );
      font.setFamily( this._splitFamily( style.fontFamily ) );
      font.setBold( this._isBold( style.fontWeight ) );
      font.setItalic( style.fontStyle === "italic" || style.fontStyle === "oblique" );
      return font;
    },

    _splitFamily : function( value ) {
      var result = [];
      var parts = value.split( "," );
      for( var i = 0; i < parts.length; i++ ) {
        var part = parts[ i ].trim().replace( /^["']|["']$/g, "" );
        if( part.length > 0 ) {
          result.push( part );
        }
      }
      return result;
    },

    _isBold : function( value ) {
      if( value === "bold" || value === "bolder" ) {
        return true;
      }
      var weight = parseInt( value, 10 );
      return !isNaN( weight ) && weight >= 600;
    },

    /**
     * Splits the "rgb( r, g, b )" or "rgba( r, g, b, a )" that a computed style gives back.
     */
    _toRgba : function( value ) {
      var match = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?\s*\)/.exec( value );
      if( match === null ) {
        return null;
      }
      var alpha = 1;
      if( match[ 4 ] !== undefined ) {
        alpha = match[ 4 ].indexOf( "%" ) === -1
              ? parseFloat( match[ 4 ] )
              : parseFloat( match[ 4 ] ) / 100;
      }
      return [
        Math.round( parseFloat( match[ 1 ] ) ),
        Math.round( parseFloat( match[ 2 ] ) ),
        Math.round( parseFloat( match[ 3 ] ) ),
        alpha
      ];
    }

  }

} );

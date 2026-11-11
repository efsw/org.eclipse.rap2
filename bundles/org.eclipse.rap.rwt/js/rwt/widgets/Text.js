/*******************************************************************************
 * Copyright (c) 2010, 2015 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

(function() {

rwt.qx.Class.define( "rwt.widgets.Text", {

  extend : rwt.widgets.base.BasicText,

  construct : function( isTextarea ) {
    this.base( arguments );
    if( isTextarea ) {
      this._inputTag = "textarea";
      this._inputType = null;
      this._inputOverflow = "auto";
      this.setAppearance( "text-area" );
      this.setAllowStretchY( true );
      this.__oninput = rwt.util.Functions.bind( this._oninputDomTextarea, this );
    }
    this._message = null;
    this._messageElement = null;
    this._searchIconElement = null;
    this._cancelIconElement = null;
    this._ornaments = [];
    this._ornamentElements = [];
  },

  destruct : function() {
    this._ornaments = null;
    this._ornamentElements = null;
    this._messageElement = null;
    this._searchIconElement = null;
    this._cancelIconElement = null;
    this.__oninput = null;
  },

  properties : {

    wrap : {
      check : "Boolean",
      init : true,
      apply : "_applyWrap"
    }

  },

  members : {

    //////
    // API

    setMessage : function( value ) {
      this._message = value ? rwt.util.Encoding.escapeText( value, false ) : null;
      this._updateMessage();
    },

    getMessage : function() {
      return this._message;
    },

    /**
     * Quello che il campo mostra dentro la propria area di edit accanto al testo: icone, testi
     * brevi, piccoli bottoni. Ogni ornamento arriva gia' misurato dal server -
     * { id, position, width, image, text, toolTip, style, selectable } - e qui viene solo
     * disposto: quelli di sinistra dal bordo verso il testo, quelli di destra lo stesso.
     */
    setOrnaments : function( value ) {
      this._ornaments = value ? value : [];
      this._updateOrnaments();
      if( this._isCreated ) {
        this._syncFieldWidth();
        this._syncFieldLeft();
        this._layoutMessageX();
      }
    },

    getOrnaments : function() {
      return this._ornaments;
    },

    setPasswordMode : function( value ) {
      var type = value ? "password" : "text";
      if( !this._isTextArea() && this._inputType != type ) {
        this._inputType = type;
        if( this._isCreated ) {
          this._inputElement.type = this._inputType;
        }
      }
    },

    ////////////////
    // event handler

    _ontabfocus : function() {
      if( this._isTextArea() ) {
        this._renderSelection();
      } else {
        this.selectAll();
      }
    },

    _onkeydown : function( event ) {
      this.base( arguments, event );
      if(    event.getKeyIdentifier() == "Enter"
          && !event.isShiftPressed()
          && !event.isAltPressed()
          && !event.isCtrlPressed()
          && !event.isMetaPressed() )
      {
        if( this._isTextArea() ) {
          event.stopPropagation();
        }
        if( this._shouldNotifyDefaultSelection() ) {
          rwt.remote.EventUtil.notifyDefaultSelected( this );
        }
      }
    },

    _shouldNotifyDefaultSelection : function() {
      // Emulate SWT (on Windows) where a default button takes precedence over
      // a SelectionListener on a text field when both are on the same shell.
      var shell = rwt.widgets.util.WidgetUtil.getShell( this );
      var defButton = shell ? shell.getDefaultButton() : null;
      var hasDefaultButton = defButton != null && defButton.isSeeable() && defButton.getEnabled();
      return !hasDefaultButton && !this._isTextArea();
    },

    _onMouseDownUp : function( event ) {
      this.base( arguments, event );
      if( event.getType() === "mousedown" ) {
        var target = event.getDomTarget();
        var detail = null;
        if( target === this._searchIconElement ) {
          detail = "search";
        } else if( target === this._cancelIconElement ) {
          this.setValue( "" );
          detail = "cancel";
        }
        if( detail != null ) {
          rwt.remote.EventUtil.notifyDefaultSelected( this, 0, 0, 0, 0, detail );
        }
        this._notifyOrnamentSelection( target );
      }
    },

    /*
     * Il clic su un ornamento va al server col suo id. Non passa da notify() del remote object,
     * che manda solo gli eventi per cui il server ha dichiarato un ascolto: qui l'ascolto e' gia'
     * scritto nell'ornamento stesso, ed e' "selectable".
     */
    _notifyOrnamentSelection : function( target ) {
      if( !this.getEnabled() || rwt.remote.EventUtil.getSuspended() ) {
        return;
      }
      for( var i = 0; i < this._ornamentElements.length; i++ ) {
        var element = this._ornamentElements[ i ];
        if( element.contains( target ) && element.rwtOrnament.selectable ) {
          var connection = rwt.remote.Connection.getInstance();
          var id = rwt.remote.ObjectRegistry.getId( this );
          connection.getMessageWriter().appendNotify( id, "OrnamentSelection", {
            "id" : element.rwtOrnament.id
          } );
          connection.send();
          return;
        }
      }
    },

    ///////////////
    // send changes

    _handleSelectionChange : function( start, length ) {
      this.base( arguments, start, length );
      if( !rwt.remote.EventUtil.getSuspended() ) {
        var remoteObject = rwt.remote.Connection.getInstance().getRemoteObject( this );
        remoteObject.set( "selection", [ start, start + length ] );
      }
    },

    _handleModification : function() {
      var remoteObject = rwt.remote.Connection.getInstance().getRemoteObject( this );
      remoteObject.set( "text", this.getComputedValue() );
      this._notifyModify();
      this._detectSelectionChange();
    },

    _notifyModify : function() {
      var connection = rwt.remote.Connection.getInstance();
      if( connection.getRemoteObject( this ).isListening( "Modify" ) ) {
        connection.onNextSend( this._onSend, this );
        connection.sendDelayed( 500 );
      }
    },

    _onSend : function() {
      if( !this.isDisposed() ) {
        rwt.remote.Connection.getInstance().getRemoteObject( this ).notify( "Modify", null, true );
      }
    },

    ///////////////////
    // textarea support

    _applyElement : function( value, oldValue ) {
      this.base( arguments, value, oldValue );
      if( this._isTextArea() ) {
        this._styleWrap();
      }
      // Fix for bug 306354
      this._inputElement.style.paddingRight = "1px";
      this._updateAllIcons();
      this._updateOrnaments();
      this._updateMessage();
    },

    _webkitMultilineFix : function() {
      if( !this._isTextArea() ) {
        this.base( arguments );
      }
    },

    _applyWrap : function() {
      if( this._isTextArea() ) {
        this._styleWrap();
      }
    },

    _styleWrap : rwt.util.Variant.select( "qx.client", {
      "gecko" : function() {
        if( this._inputElement ) {
          var wrapValue = this.getWrap() ? "soft" : "off";
          var styleValue = this.getWrap() ? "" : "auto";
          this._inputElement.setAttribute( 'wrap', wrapValue );
          this._inputElement.style.overflow = styleValue;
        }
      },
      "default" : function() {
        if( this._inputElement ) {
          var wrapValue = this.getWrap() ? "soft" : "off";
          this._inputElement.setAttribute( 'wrap', wrapValue );
        }
      }
    } ),

    _applyMaxLength : function( value, oldValue ) {
      if( !this._isTextArea() ) {
        this.base( arguments, value, oldValue );
      }
    },

    _oninputDomTextarea : function( event ) {
      try {
        var maxLength = this.getMaxLength();
        var fireEvents = true;
        if( maxLength != null ) {
          var value = this._inputElement.value;
          if( value.length > this.getMaxLength() ) {
            var oldValue = this.getValue();
            // NOTE [tb] : When pasting strings, this might not always
            //             behave like SWT. There is no reliable fix for that.
            var position = this._getSelectionStart();
            if( oldValue.length == ( value.length - 1 ) ) {
              // The user added one character, undo.
              this._inputElement.value = oldValue;
              this._setSelectionStart( position - 1 );
              this._setSelectionLength( 0 );
            } else if( value.length >= oldValue.length && value != oldValue) {
              // The user pasted a string, shorten:
              this._inputElement.value = value.slice( 0, this.getMaxLength() );
              this._setSelectionStart( Math.min( position, this.getMaxLength() ) );
              this._setSelectionLength( 0 );
            }
            if( this._inputElement.value == oldValue ) {
              fireEvents = false;
            }
          }
        }
        if( fireEvents ) {
          this._oninput( event );
        }
      } catch( ex ) {
        rwt.runtime.ErrorHandler.processJavaScriptError( ex );
      }
    },

    _isTextArea : function() {
      return this._inputTag === "textarea";
    },

    ////////////////
    // icons support

    // overrided
    _syncFieldWidth : function() {
      if( this._inputElement ) {
        var width =   this.getInnerWidth()
                    - this._getIconOuterWidth( "search" )
                    - this._getIconOuterWidth( "cancel" )
                    - this._getOrnamentsOuterWidth( "left" )
                    - this._getOrnamentsOuterWidth( "right" );
        this._inputElement.style.width = Math.max( 2, width ) + "px";
      }
    },

    _syncFieldLeft : function() {
      if( this._inputElement ) {
        var style = this._inputElement.style;
        // gli ornamenti non si specchiano con la direzione: sinistra resta sinistra
        var ornaments = this._getOrnamentsOuterWidth( "left" );
        if( this.getDirection() === "rtl" ) {
          style.marginLeft = ornaments + "px";
          style.marginRight = this._getIconOuterWidth( "search" ) + "px";
        } else {
          style.marginLeft = ( this._getIconOuterWidth( "search" ) + ornaments ) + "px";
          style.marginRight = "0";
        }
      }
    },

    _updateAllIcons : function() {
      if( this._isCreated ) {
        this._updateIcon( "search" );
        this._updateIcon( "cancel" );
      }
    },

    _updateIcon : function( iconId ) {
      var element = this._getIconElement( iconId );
      if( this._hasIcon( iconId ) && element == null ) {
        element = document.createElement( "div" );
        element.style.position = "absolute";
        element.style.cursor = "pointer";
        this._getTargetNode().insertBefore( element, this._inputElement );
        this._setIconElement( iconId, element );
      }
      if( element ) {
        var image = this._getIconImage( iconId );
        rwt.html.Style.setBackgroundImage( element, image ? image[ 0 ] : null );
      }
      this._layoutIcon( iconId );
    },

    _layoutAllIcons : function() {
      this._layoutIcon( "search" );
      this._layoutIcon( "cancel" );
      this._layoutOrnaments();
    },

    ////////////////////
    // ornaments support

    /* fra un ornamento e quello che gli sta accanto: lo stesso numero di TextOrnamentUtil.SPACING */
    _ORNAMENT_SPACING : 6,

    /* fra l'icona e il testo dello stesso ornamento: TextOrnamentUtil.IMAGE_TEXT_GAP */
    _ORNAMENT_IMAGE_TEXT_GAP : 4,

    _hasOrnaments : function() {
      return !this._isTextArea() && this._ornaments != null && this._ornaments.length > 0;
    },

    _getOrnamentsOuterWidth : function( position ) {
      var result = 0;
      if( this._hasOrnaments() ) {
        for( var i = 0; i < this._ornaments.length; i++ ) {
          if( this._ornaments[ i ].position === position ) {
            result += this._ornaments[ i ].width + this._ORNAMENT_SPACING;
          }
        }
      }
      return result;
    },

    _updateOrnaments : function() {
      if( !this._isCreated || this._ornamentElements == null ) {
        return;
      }
      for( var i = 0; i < this._ornamentElements.length; i++ ) {
        var old = this._ornamentElements[ i ];
        if( old.parentNode ) {
          old.parentNode.removeChild( old );
        }
      }
      this._ornamentElements = [];
      if( this._hasOrnaments() ) {
        for( var j = 0; j < this._ornaments.length; j++ ) {
          var element = this._createOrnamentElement( this._ornaments[ j ] );
          this._getTargetNode().insertBefore( element, this._inputElement );
          this._ornamentElements.push( element );
        }
      }
      this._layoutOrnaments();
    },

    _createOrnamentElement : function( ornament ) {
      var element = document.createElement( "div" );
      element.className = "rwt-Text-ornament";
      element.rwtOrnament = ornament;
      var style = element.style;
      style.position = "absolute";
      style.top = "0px";
      style.bottom = "0px";
      style.display = "flex";
      style.alignItems = "center";
      style.justifyContent = "center";
      style.overflow = "hidden";
      style.whiteSpace = "nowrap";
      style.boxSizing = "border-box";
      style.userSelect = "none";
      style.width = ornament.width + "px";
      style.cursor = ornament.selectable ? "pointer" : "default";
      // di default un ornamento ha la tinta tenue del messaggio a campo vuoto; il suo stile la cambia
      style.color = this._getMessageStyle().textColor || "";
      var font = this.getFont();
      if( font ) {
        font.renderElement( element );
      }
      if( ornament.toolTip ) {
        element.title = ornament.toolTip;
      }
      var image = ornament.image;
      if( image && image[ 0 ] ) {
        var icon = document.createElement( "div" );
        icon.style.flex = "none";
        icon.style.width = image[ 1 ] + "px";
        icon.style.height = image[ 2 ] + "px";
        icon.style.backgroundRepeat = "no-repeat";
        icon.style.backgroundPosition = "center";
        if( image[ 0 ].indexOf( "url(" ) === 0 ) {
          // una forma: e' gia' un'immagine css, e avvolgerla ancora la romperebbe
          icon.style.backgroundImage = image[ 0 ];
          icon.style.backgroundSize = "contain";
        } else {
          rwt.html.Style.setBackgroundImage( icon, image[ 0 ] );
        }
        element.appendChild( icon );
      }
      if( ornament.text ) {
        var text = document.createElement( "span" );
        text.textContent = ornament.text;
        if( image && image[ 0 ] ) {
          text.style.marginLeft = this._ORNAMENT_IMAGE_TEXT_GAP + "px";
        }
        element.appendChild( text );
      }
      if( ornament.style ) {
        var declarations = this._parseCssDeclarations( ornament.style );
        for( var i = 0; i < declarations.length; i++ ) {
          style.setProperty( declarations[ i ][ 0 ], declarations[ i ][ 1 ], declarations[ i ][ 2 ] );
        }
      }
      return element;
    },

    /*
     * Le posizioni si contano dentro il riquadro del campo, bordo escluso: il rientro del campo
     * prima, poi l'icona del campo di ricerca se c'e', poi gli ornamenti nell'ordine della lista.
     */
    _layoutOrnaments : function() {
      if( this._ornamentElements == null || this._ornamentElements.length === 0 ) {
        return;
      }
      var rtl = this.getDirection() === "rtl";
      var left = this.getPaddingLeft() + this._getIconOuterWidth( rtl ? "cancel" : "search" );
      var right = this.getPaddingRight() + this._getIconOuterWidth( rtl ? "search" : "cancel" );
      for( var i = 0; i < this._ornamentElements.length; i++ ) {
        var element = this._ornamentElements[ i ];
        var ornament = element.rwtOrnament;
        if( ornament.position === "right" ) {
          element.style.left = "";
          element.style.right = right + "px";
          right += ornament.width + this._ORNAMENT_SPACING;
        } else {
          element.style.right = "";
          element.style.left = left + "px";
          left += ornament.width + this._ORNAMENT_SPACING;
        }
      }
    },

    _layoutIcon : function( iconId ) {
      var element = this._getIconElement( iconId );
      if( element ) {
        var style = element.style;
        var image = this._getIconImage( iconId );
        var iconWidth = image ? image[ 1 ] : 0;
        var iconHeight = image ? image[ 2 ] : 0;
        var styleMap = this._getMessageStyle();
        style.width = iconWidth + "px";
        style.height = iconHeight + "px";
        style.top = Math.round( this.getInnerHeight() / 2 - iconHeight / 2 ) + "px";
        if( this._getIconPosition( iconId ) === "right" ) {
          style.left = "";
          style.right = styleMap.paddingRight + "px";
        } else {
          style.left = styleMap.paddingLeft + "px";
          style.right = "";
        }
      }
    },

    _getIconElement : function( iconId ) {
      return iconId === "search" ? this._searchIconElement : this._cancelIconElement;
    },

    _setIconElement : function( iconId, element ) {
      if( iconId === "search" ) {
        this._searchIconElement = element;
      } else {
        this._cancelIconElement = element;
      }
    },

    _getIconOuterWidth : function( iconId ) {
      var image = this._getIconImage( iconId );
      if( this._hasIcon( iconId ) && image != null ) {
        return image[ 1 ] + this._getIconSpacing( iconId );
      }
      return 0;
    },

    _hasIcon : function( iconId ) {
      return this.hasState( iconId === "search" ? "rwt_ICON_SEARCH" : "rwt_ICON_CANCEL" );
    },

    _getIconImage : function( iconId ) {
      return this._hasIcon( iconId ) ? this._getIconStyle( iconId ).icon : null;
    },

    _getIconPosition : function( iconId ) {
      var rtl = this.getDirection() === "rtl";
      var searchPos = rtl ? "right" : "left";
      var cancelPos = rtl ? "left" : "right";
      return iconId === "search" ? searchPos : cancelPos;
    },

    _getIconSpacing : function( iconId ) {
      return this._hasIcon( iconId ) ? this._getIconStyle( iconId ).spacing : 0;
    },

    _getIconStyle : function( iconId ) {
      var manager = rwt.theme.AppearanceManager.getInstance();
      var states = {};
      if( iconId === "search" ) {
        states[ "search" ] = true;
      }
      if( this._customVariant !== null ) {
        states[ this._customVariant ] = true;
      }
      return manager.styleFrom( "text-field-icon", states );
    },

    ///////////////////
    // password support

    _reCreateInputField : function() {
      var selectionStart = this._getSelectionStart();
      var selectionLength = this._getSelectionLength();
      this._inputElement.parentNode.removeChild( this._inputElement );
      this._inputElement.onpropertychange = null;
      this._inputElement = null;
      this._firstInputFixApplied = false;
      this._textColor = null;
      this._applyElement( this.getElement(), null );
      this._afterAppear();
      this._postApply();
      this._applyFocused( this.getFocused() );
      this._setSelectionStart( selectionStart );
      this._setSelectionLength( selectionLength );
    },

    //////////////////
    // message support

    _postApply : function() {
      this.base( arguments );
      this._syncFieldLeft();
      this._layoutAllIcons();
      this._layoutMessageX();
    },

    _applyValue : function( newValue, oldValue ) {
      this.base( arguments, newValue, oldValue );
      this._updateMessageVisibility();
      if( !rwt.remote.EventUtil.getSuspended() ) {
        this._handleModification();
      }
    },

    _applyFocused : function( newValue, oldValue ) {
      this.base( arguments, newValue, oldValue );
      this._updateMessageVisibility();
      if( newValue && ( this.getValue() === "" || this.getValue() == null ) ) {
        this._forceFocus();
      }
    },

    _forceFocus : rwt.util.Variant.select( "qx.client", {
      "webkit|blink" : function() {
        rwt.client.Timer.once( function() {
          if( this._inputElement ) {
            this._inputElement.focus();
          }
        }, this, 1 );
      },
      "default" : function() {
        // nothing to do
      }
    } ),

    _applyCursor : function( newValue, oldValue ) {
      this.base( arguments, newValue, oldValue );
      this._updateMessageCursor();
    },

    _applyFont : function( newValue, oldValue ) {
      this.base( arguments, newValue, oldValue );
      this._updateMessageFont();
      this._updateOrnaments();
    },

    _applyDirection : function( value ) {
      this.base( arguments, value );
      this._applyTextAlign();
      this._syncFieldLeft();
      this._layoutAllIcons();
      this._layoutMessageX();
    },

    // Overwritten
    _preventEnter : function( event ) {
      if( !this._isTextArea() ) {
        this.base( arguments, event );
      }
    },

    _updateMessage : function() {
      if( this._isCreated ) {
        if( this._message != null && this._message !== "" && this._messageElement == null ) {
          this._messageElement = document.createElement( "div" );
          var style = this._messageElement.style;
          style.position = "absolute";
          style.outline = "none";
          style.overflow = "hidden";
          style.whiteSpace = "nowrap";
          var styleMap = this._getMessageStyle();
          style.color = styleMap.textColor || "";
          rwt.html.Style.setTextShadow( this._messageElement, styleMap.textShadow );
          this._getTargetNode().insertBefore( this._messageElement, this._inputElement );
        }
        if( this._messageElement ) {
          this._messageElement.innerHTML = this._message ? this._message : "";
        }
        this._updateMessageCursor();
        this._updateMessageVisibility();
        this._updateMessageFont();
        this._layoutMessageX();
      }
    },

    _centerFieldVertically : function() {
      this.base( arguments );
      this._layoutMessageY();
    },

    _layoutMessageX : function() {
      if( this._messageElement ) {
        var styleMap = this._getMessageStyle();
        var style = this._messageElement.style;
        var width = this.getBoxWidth()
                    - this._cachedBorderLeft
                    - this._cachedBorderRight
                    - styleMap.paddingLeft
                    - styleMap.paddingRight
                    - this._getIconOuterWidth( "search" )
                    - this._getIconOuterWidth( "cancel" )
                    - this._getOrnamentsOuterWidth( "left" )
                    - this._getOrnamentsOuterWidth( "right" );
        style.width = Math.max( 0, width ) + "px";
        if( this._isTextArea() ) {
          // The text-area padding is hard codded in the appearances
          style.left = "3px";
        } else {
          var leftIcon = this.getDirection() === "rtl" ? "cancel" : "search";
          style.left = (   this._getIconOuterWidth( leftIcon )
                         + this._getOrnamentsOuterWidth( "left" )
                         + styleMap.paddingLeft ) + "px";
        }
      }
    },

    _layoutMessageY : function() {
      if( this._messageElement ) {
        if( this._isTextArea() ) {
          this._messageElement.style.top = "0px";
        } else {
          this._messageElement.style.top = this.getInputElement().style.top;
        }
      }
    },

    _getMessageStyle : function() {
      var manager = rwt.theme.AppearanceManager.getInstance();
      return manager.styleFrom( "text-field-message", {} );
    },

    _updateMessageVisibility : function() {
      if( this._messageElement ) {
        var visible = ( this.getValue() == null || this.getValue() === "" ) && !this.getFocused();
        this._messageElement.style.display = visible ? "" : "none";
      }
    },

    _updateMessageFont : function() {
      if( this._messageElement ) {
        var font = this.getFont();
        font.renderElement( this._messageElement );
      }
    },

    _updateMessageCursor : function() {
      if( this._messageElement ) {
        var cursor = this._inputElement.style.cursor;
        if( cursor == null || cursor === "" ) {
          cursor = "text";
        }
        this._messageElement.style.cursor = cursor;
      }
    }

  }

} );

}() );


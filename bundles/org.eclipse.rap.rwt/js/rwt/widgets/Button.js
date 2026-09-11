/*******************************************************************************
 * Copyright (c) 2009, 2015 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

rwt.qx.Class.define( "rwt.widgets.Button", {

  extend : rwt.widgets.base.BasicButton,

  construct : function( buttonType ) {
    this.base( arguments, buttonType );
    this._alignment = buttonType === "arrow" ? "up" : "center";
    switch( buttonType ) {
     case "arrow":
       this.addState( "rwt_UP" );
       this.setAppearance( "push-button" );
     break;
     case "push":
     case "toggle":
       this.setAppearance( "push-button" );
     break;
     case "check":
       this.setAppearance( "check-box" );
     break;
     case "radio":
       this.setAppearance( "radio-button" );
    }
    switch( buttonType ) {
     case "check":
       this.setAriaRole( "checkbox" );
       this.setAriaSelectionAttribute( "aria-checked" );
     break;
     case "radio":
       this.setAriaRole( "radio" );
       this.setAriaSelectionAttribute( "aria-checked" );
     break;
     case "toggle":
       this.setAriaRole( "button" );
       this.setAriaSelectionAttribute( "aria-pressed" );
     break;
     default:
       this.setAriaRole( "button" );
    }
    this.initTabIndex();
    this._rawText = null;
    this._iconShape = null;
    this._iconShapeSize = 0;
    this._rawSecondaryText = null;
    this._mnemonicIndex = null;
    this._markupEnabled = false;
  },

  destruct : function() {
    this.setMnemonicIndex( null );
  },

  properties : {

    tabIndex : {
      refine : true,
      init : 1
    },

    /*
     * Il colore e il font del secondo testo arrivano dall'appearance, che li legge dall'elemento di
     * tema Button-SecondaryText: sono proprieta' e non valori scritti a mano perche' l'appearance
     * si applica per proprieta', e cosi' seguono gli stati del pulsante (disabilitato, hover).
     */
    secondaryTextColor : {
      apply : "_applySecondaryTextStyle",
      nullable : true,
      themeable : true
    },

    secondaryFont : {
      apply : "_applySecondaryTextStyle",
      nullable : true,
      themeable : true
    }

  },

  members : {

    setMarkupEnabled : function( value ) {
      this._markupEnabled = value;
    },

    setText : function( value ) {
      this._rawText = value;
      this._mnemonicIndex = null;
      this._applyText( false );
      this.dispatchSimpleEvent( "changeText", this ); // used by Synchronizer.js
    },

    /**
     * La forma tinta che sta nel posto dell'immagine.
     * <p>
     * Non e' un'immagine e non passa da setImage di proposito: quel valore e' del programma, e se la
     * forma ci finisse dentro azzerare l'immagine cancellerebbe anche la forma. Qui restano due
     * valori distinti e la cella mostra l'immagine se c'e', altrimenti la forma - vedi
     * _updateButtonImage.
     * </p>
     */
    setIconShape : function( value, side ) {
      this._iconShape = value ? value : null;
      this._iconShapeSize = side;
      this._updateButtonImage();
    },

    // overwritten: senza immagine, nella cella va la forma
    _updateButtonImage : function() {
      var image =
          ( this._hotImage[ 0 ] != null && this.hasState( "over" ) )
        ? this._hotImage
        : this._image;
      if( image[ 0 ] == null && this._iconShape != null ) {
        image = [ this._iconShape, this._iconShapeSize, this._iconShapeSize ];
      }
      if( this.getCellContent( 1 ) !== image[ 0 ] ) {
        this.setCellContent( 1, image[ 0 ] );
        this.setCellDimension( 1, image[ 1 ], image[ 2 ] );
      }
    },

    /**
     * Il secondo testo, che sta nella quarta cella con colore e font suoi.
     */
    setSecondaryText : function( value ) {
      this._rawSecondaryText = value;
      this._applySecondaryText();
    },

    setMnemonicIndex : function( value ) {
      this._mnemonicIndex = value;
      var mnemonicHandler = rwt.widgets.util.MnemonicHandler.getInstance();
      if( ( typeof value === "number" ) && ( value >= 0 ) ) {
        mnemonicHandler.add( this, this._onMnemonic );
      } else {
        mnemonicHandler.remove( this );
      }
    },

    getMnemonicIndex : function() {
      return this._mnemonicIndex;
    },

    setAlignment : function( value ) {
      if( this.hasState( "rwt_ARROW" ) ) {
        this.removeState( "rwt_" + this._alignment.toUpperCase() );
        this.addState( "rwt_" + value.toUpperCase() );
      } else {
        this.setHorizontalChildrenAlign( value );
      }
      this._alignment = value;
    },

    setWrap : function( value ) {
      if( value ) {
        this.setFlexibleCell( 2 );
        this.setWordWrap( true );
      }
    },

    getToolTipTargetBounds : function() {
      if( this.getSelectionIndicator() ) {
        var styleTop = parseInt( this.getCellNode( 0 ).style.top, 10 );
        return  {
          "left" : this._cachedBorderLeft + this.getPaddingLeft(),
          "top" : this._cachedBorderTop + styleTop,
          "width" : this.getSelectionIndicator()[ 1 ],
          "height" : this.getSelectionIndicator()[ 2 ]
        };
      } else {
        return  {
          "left" : 0,
          "top" : 0,
          "width" : this.getBoxWidth(),
          "height" : this.getBoxHeight()
        };
      }
    },

    computeBadgePosition : function() {
      return [ -3, -5, "auto", "auto" ];
    },

    _onMnemonic : function( event ) {
      switch( event.type ) {
        case "show":
          this._applyText( true );
        break;
        case "hide":
          this._applyText( false );
        break;
        case "trigger":
          var charCode = this._rawText.toUpperCase().charCodeAt( this._mnemonicIndex );
          if( event.charCode === charCode ) {
            this.setFocused( true );
            this.execute();
            event.success = true;
          }
        break;
      }
    },

    /*
     * La cella del secondo testo si misura da se', e non e' un lusso: il MultiCellWidget misura
     * OGNI cella di testo col font del widget (__fontCache), quindi un secondo testo di peso
     * normale accanto a un principale in grassetto risulterebbe piu' largo del vero e si
     * porterebbe dietro dello spazio vuoto. Qui la misura si fa col font suo, lo stesso con cui la
     * misura il server.
     */
    _applySecondaryText : function() {
      var text = this._rawSecondaryText;
      if( text ) {
        var escaped = this._markupEnabled ? text : rwt.util.Encoding.escapeText( text, undefined );
        this.setCellContent( 3, escaped );
        this._measureSecondaryCell( escaped );
      } else {
        this.setCellContent( 3, null );
        this.setCellDimension( 3, null, null );
      }
    },

    _measureSecondaryCell : function( escaped ) {
      var font = this.getSecondaryFont();
      if( font == null ) {
        // senza un font suo vale la misura del widget, che e' quella che fa il MultiCellWidget
        this.setCellDimension( 3, null, null );
        return;
      }
      var props = {};
      font.renderStyle( props );
      var dimension = rwt.widgets.util.FontSizeCalculation.computeTextDimensions( escaped, props, null );
      this.setCellDimension( 3, dimension[ 0 ], dimension[ 1 ] );
    },

    _applySecondaryTextStyle : function() {
      if( this._rawSecondaryText ) {
        this._measureSecondaryCell( this.getCellContent( 3 ) );
      }
      this._writeSecondaryTextStyle();
    },

    /*
     * Colore e font si scrivono sul nodo della cella, che e' l'unico posto dove possono stare: il
     * widget ha un colore e un font suoi e valgono per tutte le celle. Il nodo puo' non esserci
     * ancora - le celle nascono quando la coda si svuota - e per questo la scrittura si rifa' dopo
     * ogni aggiornamento delle etichette (vedi _updateLabel).
     */
    _writeSecondaryTextStyle : function() {
      var node = this.getCellNode( 3 );
      if( node == null ) {
        return;
      }
      // la classe serve al foglio css puro del web, per raggiungere il secondo testo di UN pulsante
      node.className = "rwt-button-secondary";
      var color = this.getSecondaryTextColor();
      node.style.color = color != null && color !== "undefined" ? color : "";
      var font = this.getSecondaryFont();
      if( font != null ) {
        font.renderElement( node );
      }
    },

    // overwritten: dopo che l'etichetta e' stata scritta, il suo stile va rimesso
    _updateLabel : function( cell ) {
      this.base( arguments, cell );
      if( cell === 3 ) {
        this._writeSecondaryTextStyle();
      }
    },

    _applyText : function( mnemonic ) {
      var EncodingUtil = rwt.util.Encoding;
      if( this._rawText ) {
        var text = this._rawText;
        if( !this._markupEnabled ) {
          var mnemonicIndex = mnemonic ? this._mnemonicIndex : undefined;
          text = EncodingUtil.escapeText( this._rawText, mnemonicIndex );
          text = EncodingUtil.replaceNewLines( text, "<br/>" );
        }
        this.setCellContent( 2, text );
      } else {
        this.setCellContent( 2, null );
      }
    },

    //overwritten:
    _applyEnabled : function( value ) {
      this.base( arguments, value );
      if( this._mnemonicIndex !== null && !value ) {
        this._applyText( false );
      }
    },

    //overwritten:
    _afterRenderLayout : function() {
      if( this.getFocused() ) {
         this._showFocusIndicator();
      }
    },

    _ontabfocus : function() {
      this._showFocusIndicator();
    },

    _showFocusIndicator : function() {
      if( !rwt.widgets.util.FocusHandler.mouseFocus ) {
        var focusIndicator = rwt.widgets.util.FocusIndicator.getInstance();
        var node = this.getCellNode( 2 ) != null ? this.getCellNode( 2 ) : this.getCellNode( 1 );
        focusIndicator.show( this, "Button-FocusIndicator", node );
      }
    },

    _visualizeBlur : function() {
      this.base( arguments );
      rwt.widgets.util.FocusIndicator.getInstance().hide( this );
    },

    // overwritten:
    _notifySelected : function() {
      rwt.remote.EventUtil.notifySelected( this );
    }

  }
} );

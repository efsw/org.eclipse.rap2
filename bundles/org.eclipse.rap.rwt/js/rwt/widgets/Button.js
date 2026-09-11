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

  statics : {
    /*
     * Il prefisso della maschera css, o null dove non c'e'. Serve a tingere la freccetta del menu
     * col colore del testo del pulsante: la maschera usa il canale alfa dell'immagine e il colore
     * lo mette il fondo, quindi un disegno solo vale per ogni famiglia di pulsanti.
     */
    MASK :   ( "maskImage" in document.documentElement.style ) ? "mask"
           : ( "webkitMaskImage" in document.documentElement.style ) ? "webkitMask"
           : null
  },

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
    /*
     * La cella del TESTO e' quella flessibile: quando lo spazio non basta cede lei - il testo si
     * accorcia - e immagine, secondo testo e freccetta restano al loro posto. Senza dichiararlo
     * (prima lo faceva solo setWrap) le celle finiscono oltre il bordo e si perde l'ULTIMA, cioe'
     * proprio la freccetta del menu.
     */
    this.setFlexibleCell( 2 );
    this._rawText = null;
    this._iconShape = null;
    this._iconShapeSize = 0;
    this._dropDown = false;
    this._dropDownPressed = false;
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
    /*
     * La freccetta del menu, dal tema: e' un segno del widget - "qui si apre un menu" - quindi il
     * server manda solo se mostrarla, e l'immagine la decide il tema.
     */
    dropDownIcon : {
      apply : "_applyDropDownIcon",
      nullable : true,
      themeable : true
    },

    /* l'aria a sinistra della freccetta, dove passa il filo della zona */
    dropDownSpacing : {
      apply : "_applyDropDownIcon",
      init : 0,
      themeable : true
    },

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
     * Se mostrare la freccetta del menu. Il disegno arriva dall'appearance.
     */
    setDropDown : function( value ) {
      this._dropDown = value;
      this._updateDropDownCell();
    },

    _applyDropDownIcon : function() {
      this._updateDropDownCell();
    },

    // overwritten: l'aria della freccetta cambia lato con la direzione delle celle
    _applyVertical : function( value, old ) {
      this.base( arguments, value, old );
      this._updateDropDownCell();
    },

    /*
     * Il lato a cui si appoggia il disegno della freccetta: quello dove il pulsante finisce. Il
     * vuoto della spaziatura resta dalla parte opposta - verso il testo - ed e' li' che passa il
     * filo della zona.
     */
    _dropDownIconPosition : function() {
      if( this.getVertical() ) {
        return "center bottom";
      }
      return this.getDirection() === "rtl" ? "left center" : "right center";
    },

    _updateDropDownCell : function() {
      var icon = this._dropDown ? this.getDropDownIcon() : null;
      var url = icon ? icon[ 0 ] : null;
      /*
       * La cella e' piu' grande dell'immagine: immagine piu' la spaziatura dichiarata dal tema. Il
       * vuoto resta dalla parte del testo - a sinistra quando le celle sono in fila, sopra quando
       * sono in colonna - ed e' quello che da' aria fra il testo e il filo della zona. Il server
       * somma la stessa cosa in computeSize.
       */
      var spacing = this.getDropDownSpacing();
      var vertical = this.getVertical();
      if( this.getCellContent( 4 ) !== url ) {
        this.setCellContent( 4, url );
      }
      this.setCellDimension( 4,
                             icon ? icon[ 1 ] + ( vertical ? 0 : spacing ) : 0,
                             icon ? icon[ 2 ] + ( vertical ? spacing : 0 ) : 0 );
      this._updateDropDownZone();
    },

    /*
     * La ZONA della freccetta: un elemento nostro, dietro la cella, a tutta altezza e fino al bordo
     * destro. Serve a due cose - l'hover proprio e il click che apre il menu - e il suo aspetto lo
     * dipinge il foglio css puro sul :hover vero del browser, con la classe qui sotto: un'appearance
     * non sa dipingere un elemento nostro, e "sono sopra la freccetta" non e' uno stato del tema.
     *
     * z-index -1 la mette dietro alla freccetta e davanti al fondo del pulsante. La cella della
     * freccetta perde i pointer-events, altrimenti il puntatore sopra la freccetta starebbe sopra la
     * CELLA - sorella della zona, non figlia - e la zona non risulterebbe in hover.
     */
    _updateDropDownZone : function() {
      var cell = this.getCellNode( 4 );
      var node = this.$dropDownZone;
      if( !this._dropDown || cell == null ) {
        if( node ) {
          node.style.display = "none";
        }
        return;
      }
      cell.style.pointerEvents = "none";
      // l'immagine appoggiata al lato dove finisce il pulsante: il vuoto della spaziatura sta
      // dall'altra parte, dove passa il filo
      cell.style.backgroundPosition = this._dropDownIconPosition();
      if( !node ) {
        node = document.createElement( "div" );
        this.$dropDownZone = node;
        this.$el.append( node );
      }
      /*
       * La zona comincia dove comincia la CELLA della freccetta, non prima: la cella si porta
       * dentro la propria aria - immagine piu' spaziatura, con l'immagine appoggiata al bordo
       * esterno - quindi il filo cade in quel vuoto. Sottraendo anche la spaziatura del widget,
       * com'era prima, il filo finiva attaccato all'ultima lettera del testo.
       *
       * In colonna la zona e' una fascia in fondo invece che una striscia di lato, e il filo passa
       * sopra: la classe in piu' serve al foglio css puro per spostare il bordo.
       */
      var vertical = this.getVertical();
      node.className = "rwt-button-dropdown-zone"
                     + ( vertical ? " rwt-button-dropdown-zone-vertical" : "" );
      if( vertical ) {
        var top = parseInt( cell.style.top, 10 );
        node.style.cssText =   "position:absolute;left:0;right:0;bottom:0;z-index:-1;display:block;"
                             + "top:" + ( isNaN( top ) ? 0 : Math.max( 0, top ) ) + "px";
      } else {
        var left = parseInt( cell.style.left, 10 );
        var rtl = this.getDirection() === "rtl";
        node.style.cssText =   "position:absolute;top:0;bottom:0;z-index:-1;display:block;"
                             + ( rtl ? "left:0;right:" : "right:0;left:" )
                             + ( isNaN( left ) ? 0 : Math.max( 0, left ) ) + "px";
      }
    },

    _isOverDropDown : function( event ) {
      var node = this.$dropDownZone;
      if( !this._dropDown || node == null || node.style.display === "none" ) {
        return false;
      }
      var box = node.getBoundingClientRect();
      if( this.getVertical() ) {
        return event.getClientY() >= box.top && event.getClientY() <= box.bottom;
      }
      return event.getClientX() >= box.left && event.getClientX() <= box.right;
    },

    // overwritten: ricordo se la pressione e' cominciata nella zona della freccetta
    _onMouseDown : function( event ) {
      this._dropDownPressed = this._isOverDropDown( event );
      this.base( arguments, event );
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
      // la cella della freccetta ha appena preso la sua posizione: la zona la segue
      this._updateDropDownZone();
      this._tintDropDownIcon();
    },

    /*
     * La freccetta col colore del testo del pulsante.
     *
     * Non come immagine di sfondo ma come MASCHERA: la maschera usa il canale alfa del png e il
     * colore lo mette il fondo, quindi lo stesso disegno vale per un pulsante bianco, per uno
     * pieno e per uno spento - segue anche il colore che il tema da' allo stato disabilitato. Il
     * grigio cotto nel png invece stonava: su un primario col testo bianco si legge come una
     * macchia.
     *
     * Si rimette dopo ogni aggiornamento delle celle, perche' il MultiCellWidget riscrive
     * backgroundImage dal contenuto della cella (_updateImage) e cancellerebbe la tinta. Dove la
     * maschera non c'e', l'immagine di sfondo resta com'e': grigia, ma visibile.
     */
    _tintDropDownIcon : function() {
      var mask = rwt.widgets.Button.MASK;
      var node = this.getCellNode( 4 );
      var url = this.getCellContent( 4 );
      if( mask == null || node == null || url == null ) {
        return;
      }
      var position = this._dropDownIconPosition();
      node.style.backgroundImage = "none";
      node.style.backgroundColor = this.getTextColor() || "";
      node.style[ mask + "Image" ] = "url(" + url + ")";
      node.style[ mask + "Repeat" ] = "no-repeat";
      node.style[ mask + "Position" ] = position;
    },

    // overwritten: il colore del testo e' anche il colore della freccetta
    _applyTextColor : function( value, old ) {
      this.base( arguments, value, old );
      this._tintDropDownIcon();
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

    /*
     * overwritten: un click nella zona della freccetta parte con detail "arrow", come in ToolItem -
     * il server lo traduce da se' in SWT.ARROW, e chi ascolta la selezione sa distinguere "apri il
     * menu" da "esegui il comando".
     */
    _notifySelected : function() {
      if( this._dropDownPressed ) {
        rwt.remote.EventUtil.notifySelected( this, 0, 0, 0, 0, "arrow" );
      } else {
        rwt.remote.EventUtil.notifySelected( this );
      }
    }

  }
} );

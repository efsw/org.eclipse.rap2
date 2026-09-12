/*******************************************************************************
 * Copyright (c) 2013, 2014 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

rwt.qx.Class.define( "rwt.widgets.Label", {

  extend : rwt.widgets.base.MultiCellWidget,

  include : rwt.widgets.util.OverStateMixin,

  construct : function( styles ) {
    this.base( arguments, this._CELLORDER );
    this.setVerticalChildrenAlign( "middle" );
    this.setAlignment( "left" );
    this.setAppearance( "label-wrapper" );
    if( styles.WRAP ) {
      this.setFlexibleCell( 1 );
      this.setWordWrap( true );
    }
    this._markupEnabled = styles.MARKUP_ENABLED === true;
    this._rawText = null;
    this._mnemonicIndex = null;
    if( this._markupEnabled ) {
      this.addEventListener( "click", this._onMarkupClick, this );
    }
  },

  destruct : function() {
    this.setMnemonicIndex( null );
  },

  members : {

    _CELLORDER : [ "image", "label" ],

    setAlignment : function( value ) {
      this.setHorizontalChildrenAlign( value );
    },

    setImage : function( image ) {
      if( image ) {
        this.setCellContent( 0, image[ 0 ] );
        this.setCellDimension( 0, image[ 1 ], image[ 2 ] );
      } else {
        this.setCellContent( 0, null );
        this.setCellDimension( 0, 0, 0 );
      }
    },

    setText : function( value ) {
      this._rawText = value;
      this._applyText( false );
      this._mnemonicIndex = null;
      this.dispatchSimpleEvent( "changeText", this ); // used by Synchronizer.js
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

    _applyText : function( mnemonic ) {
      var text = this._rawText;
      if( text ) {
        if( !this._markupEnabled ) {
          var EncodingUtil = rwt.util.Encoding;
          var mnemonicIndex = mnemonic ? this._mnemonicIndex : undefined;
          // Order is important here: escapeText, replace line breaks
          text = EncodingUtil.escapeText( this._rawText, mnemonicIndex );
          text = EncodingUtil.replaceNewLines( text, "<br/>" );
          text = EncodingUtil.replaceWhiteSpaces( text ); // fixes bug 192634
        }
        this.setCellContent( 1, text );
      } else {
        this.setCellContent( 1, null );
      }
    },

    /*
     * UN LINK A FRAMMENTO DENTRO UN MARKUP E' UN EVENTO DEL WIDGET, non una navigazione.
     *
     * Un <a href="#..."> lo seguirebbe il browser: il frammento finisce nell'indirizzo e nella
     * cronologia, il tasto "indietro" lo ripropone, e premere due volte di fila lo STESSO link non
     * produce niente, perche' il frammento non cambia. Sono tre difetti per un gesto che l'
     * applicazione voleva sapere e basta.
     *
     * Quindi il click si prende qui: si ferma il giro del browser e si manda al server una
     * Selection con il frammento come testo. La regola e' stretta di proposito: solo i link a
     * FRAMMENTO, cosi' un <a href="http://..."> dentro un markup continua ad aprirsi come sempre.
     *
     * E solo se il server ascolta: notify() da se' non manda niente a chi non ha dichiarato
     * l'ascolto, ma senza questo controllo si fermerebbe comunque la navigazione, cioe' si
     * romperebbe un link a frammento in un'applicazione che non ne sa niente.
     */
    _onMarkupClick : function( event ) {
      var remoteObject = rwt.remote.Connection.getInstance().getRemoteObject( this );
      if( !remoteObject.isListening( "Selection" ) ) {
        return;
      }
      var fragment = this._findFragmentLink( event.getDomTarget() );
      if( fragment === null ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      rwt.remote.EventUtil.notifySelected( this, { "text" : fragment } );
    },

    /** il frammento del link su cui si e' cliccato, oppure null se non si e' cliccato su uno */
    _findFragmentLink : function( node ) {
      var element = this.getElement();
      var current = node;
      while( current != null && current !== element ) {
        if( current.tagName === "A" ) {
          var href = current.getAttribute( "href" );
          return href != null && href.charAt( 0 ) === "#" ? href.substr( 1 ) : null;
        }
        current = current.parentNode;
      }
      return null;
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
            var focusWidget = this.getNextSibling();
            if( focusWidget && focusWidget.getVisibility() && focusWidget.getEnabled() ) {
              focusWidget.focus();
            }
            event.success = true;
          }
        break;
      }
    },

    setTopMargin : function( value ) {
      this.setPaddingTop( value );
    },

    setLeftMargin : function( value ) {
      this.setPaddingLeft( value );
    },

    setRightMargin : function( value ) {
      this.setPaddingRight( value );
    },

    setBottomMargin : function( value ) {
      this.setPaddingBottom( value );
    }

  }

} );

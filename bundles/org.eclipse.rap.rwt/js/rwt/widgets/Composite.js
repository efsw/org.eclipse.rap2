/*******************************************************************************
 * Copyright (c) 2009, 2016 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

rwt.qx.Class.define( "rwt.widgets.Composite", {

  extend : rwt.widgets.base.Parent,

  include : [ rwt.animation.VisibilityAnimationMixin, rwt.widgets.util.OverStateMixin ],

  construct : function() {
    this.base( arguments );
    this.setAppearance( "composite" );
    this.setOverflow( "hidden" );
    this.setHideFocus( true );
    this.setEnableElementFocus( false );
    // Disable scrolling (see bug 345903)
    rwt.widgets.base.Widget.disableScrolling( this );
    this._clientArea = [ 0, 0, 0, 0 ];
    this._clientScrolling = false;
    this._clientScrollingQueued = false;
  },

  destruct : function() {
    this._clientArea = null;
  },

  statics : {

    /*
     * La tolleranza sotto la quale un contenuto che sfora non si considera sforato.
     *
     * Serve a non far comparire una barra per un pixel, e a non entrare in altalena: quando la
     * barra compare si prende dello spazio, il contenuto ci sta di nuovo, la barra sparisce, e si
     * ricomincia. Due pixel bastano a spezzare il ciclo.
     */
    CLIENT_SCROLL_TOLERANCE : 2

  },

  members : {

    setClientArea : function( clientArea ) {
      this._clientArea = clientArea;
      this.dispatchSimpleEvent( "clientAreaChanged" );
    },

    getClientArea : function() {
      return this._clientArea.concat();
    },

    _applyDirection : function( value ) {
      this.base( arguments, value );
      this.getLayoutImpl().setMirror( value === "rtl" );
    },

    /*
     * ---------------------------------------------------------------------------------------
     * LO SCORRIMENTO CHE IL SERVER NON CONOSCE
     *
     * Un composite che riceve dal server piu' contenuto di quanto ne stia nella sua area lo
     * TAGLIA: i controlli sotto al bordo non si vedono e non c'e' modo di arrivarci. Per averlo
     * scorrevole oggi bisogna dichiararlo a mano come ScrolledComposite, maschera per maschera.
     *
     * Qui il client se ne accorge da solo e apre lo scorrimento dove serve. Il server non ne sa
     * niente e non deve saperne: continua a mandare le stesse coordinate, e nessuna delle sue
     * misure cambia. Non parte una richiesta e non cambia un byte del protocollo.
     *
     * PERCHE' FUNZIONA SENZA ALTRO LAVORO: i figli sono posizionati in assoluto dentro il
     * composite, che e' il loro blocco contenitore, quindi il browser conosce gia' l'altezza vera
     * del contenuto (scrollHeight). Le due cose che temevamo funzionano gia' da sole:
     *
     *  - il fuoco: rwt.html.ScrollIntoView risale i genitori e scorre quelli con overflow auto o
     *    scroll, quindi arrivando col tab su un controllo tagliato lo porta in vista;
     *  - i popup: rwt.html.Location calcola le coordinate di pagina con getBoundingClientRect,
     *    che lo scorrimento degli antenati lo include gia'.
     *
     * E IL BLOCCO DEL BUG 345903 RESTA DOV'ERA. Quel blocco serve perche' un div, anche con
     * overflow hidden, si lascia scorrere da un figlio che prende il fuoco: il contenuto scivola e
     * non c'e' modo di rimetterlo a posto. Lo togliamo SOLO quando il contenuto sfora davvero -
     * cioe' quando compare una barra e l'utente puo' tornare indietro. Dove il contenuto ci sta,
     * scrollHeight e' uguale a clientHeight, non c'e' niente da scorrere, e il blocco resta.
     * ---------------------------------------------------------------------------------------
     */

    /*
     * Il controllo si fa dopo, una volta sola: durante un layout i figli si sistemano uno alla
     * volta e misurare a ogni passo direbbe cose diverse a ogni figlio.
     */
    _queueClientScrollingCheck : function() {
      if( this._clientScrollingQueued || this.isDisposed() ) {
        return;
      }
      this._clientScrollingQueued = true;
      rwt.client.Timer.once( this._updateClientScrolling, this, 0 );
    },

    _updateClientScrolling : function() {
      this._clientScrollingQueued = false;
      if( this.isDisposed() ) {
        return;
      }
      var node = this._getTargetNode();
      if( !node ) {
        return;
      }
      /*
       * UN COMPOSITE NASCOSTO MISURA ZERO, e zero non e' una risposta: scrollHeight e clientHeight
       * valgono tutti e due 0, il contenuto sembra starci, e si chiuderebbe lo scorrimento a una
       * scheda che semplicemente non e' quella davanti. Qui non si decide niente e si aspetta che
       * compaia - ci pensa _afterAppear a richiedere la misura.
       */
      if( node.clientHeight === 0 && node.clientWidth === 0 ) {
        return;
      }
      var tolerance = rwt.widgets.Composite.CLIENT_SCROLL_TOLERANCE;
      var needed =    node.scrollHeight > node.clientHeight + tolerance
                   || node.scrollWidth > node.clientWidth + tolerance;
      if( needed === this._clientScrolling ) {
        return;
      }
      this._clientScrolling = needed;
      if( needed ) {
        rwt.widgets.base.Widget.enableScrolling( this );
        this.setOverflow( "auto" );
      } else {
        // prima si torna in cima, poi si richiude: chiudendo per primo il contenuto resterebbe spostato
        node.scrollTop = 0;
        node.scrollLeft = 0;
        this.setOverflow( "hidden" );
        rwt.widgets.base.Widget.disableScrolling( this );
      }
    },

    /*
     * IL COMPOSITE COMPARE: in una gestione a schede e' il momento in cui si puo' misurare per la
     * prima volta. Le schede dietro esistono gia' - hanno preso il loro layout mentre erano
     * nascoste - quindi senza questo passaggio l'unica scheda che scorrerebbe e' quella aperta
     * all'apertura della maschera.
     */
    _afterAppear : function() {
      this.base( arguments );
      this._queueClientScrollingCheck();
    },

    /* il composite ha cambiato misura: quello che prima ci stava adesso puo' sforare, e viceversa */
    _layoutPost : function( changes ) {
      this.base( arguments, changes );
      this._queueClientScrollingCheck();
    },

    /* un figlio si e' spostato o ridimensionato: e' l'altro modo in cui il contenuto cambia */
    _layoutChild : function( child ) {
      this.base( arguments, child );
      this._queueClientScrollingCheck();
    }

  }

} );

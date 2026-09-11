/*******************************************************************************
 * Copyright (c) 2011, 2015 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

rwt.remote.HandlerRegistry.add( "rwt.widgets.Button", {

  factory : function( properties ) {
    var styleMap = rwt.remote.HandlerUtil.createStyleMap( properties.style );
    var buttonType = "push";
    if( styleMap.CHECK ) {
      buttonType = "check";
    } else if( styleMap.TOGGLE ) {
      buttonType = "toggle";
    } else if( styleMap.RADIO ) {
      buttonType = "radio";
    } else if( styleMap.ARROW ) {
      buttonType = "arrow";
    }
    var result = new rwt.widgets.Button( buttonType );
    result.setMarkupEnabled( properties.markupEnabled === true );
    result.setWrap( styleMap.WRAP );
    rwt.remote.HandlerUtil.addStatesForStyles( result, properties.style );
    result.setUserData( "isControl", true );
    rwt.remote.HandlerUtil.setParent( result, properties.parent );
    rwt.remote.HandlerUtil.callWithTarget( properties.parent, function( parent ) {
      result.setNoRadioGroup( parent.hasState( "rwt_NO_RADIO_GROUP" ) );
    } );
    return result;
  },

  destructor : rwt.remote.HandlerUtil.getControlDestructor(),

  getDestroyableChildren : rwt.remote.HandlerUtil.getDestroyableChildrenFinder(),

  properties : rwt.remote.HandlerUtil.extendControlProperties( [
    /**
     * @name setText
     * @methodOf Button#
     * @description Sets the receivers text to the given string.
     * @param {string} text the new text
     */
    "text",
    /**
     * @name setSecondaryText
     * @methodOf Button#
     * @description Sets a second text, shown after the main one with a style of its own.
     * @param {string} secondaryText the new secondary text
     */
    "secondaryText",
    /**
     * @name setSecondaryFont
     * @methodOf Button#
     * @description Sets the font of the secondary text; the button's preferred width accounts for
     * it, so it may change the size of the button.
     * @param {Array|null} font the new font as [ family[], size, bold, italic ] or null for the
     * themed one
     */
    "secondaryFont",
    /**
     * @name setSecondaryForeground
     * @methodOf Button#
     * @description Sets the color of the secondary text.
     * @param {int[]|null} color the new color as array [ red, green, blue ] or null for the themed
     * one
     */
    "secondaryForeground",
    "mnemonicIndex",
    "alignment",
    "image",
    /**
     * @name setIconShape
     * @methodOf Button#
     * @description Sets a shape shown where the image goes, as "&lt;side&gt;|&lt;css url&gt;". The
     * image wins over it, so clearing the image brings the shape back.
     * @param {string|null} iconShape the shape, or null for none
     */
    "iconShape",
    /**
     * @name setDropDown
     * @methodOf Button#
     * @description Shows or hides the arrow that says a menu opens from this button.
     * @param {boolean} dropDown true to show the arrow
     */
    "dropDown",
    /**
     * @name setSelection
     * @methodOf Button#
     * @description Sets the selection state of the receiver, if it is of type <code>CHECK</code>,
     * <code>RADIO</code>, or <code>TOGGLE</code>.
     *
     * <p>
     * When the receiver is of type <code>CHECK</code> or <code>RADIO</code>,
     * it is selected when it is checked. When it is of type <code>TOGGLE</code>,
     * it is selected when it is pushed in.
     * </p>
     * @param {boolean} selected the new selection state
     */
    "selection",
    "grayed",
    "badge"
  ] ),

  propertyHandler : rwt.remote.HandlerUtil.extendControlPropertyHandler( {
    "image" : function( widget, value ) {
      if( value === null ) {
        widget.setImage( value );
      } else {
        widget.setImage.apply( widget, value );
      }
    },
    "badge" : function( widget, value ) {
      rwt.widgets.util.Badges.setBadge( widget, value );
    },
    /*
     * La forma arriva come "<lato>|<url>": un valore solo, cosi' il server la confronta come una
     * stringa e un cambio di sola dimensione non passa inosservato.
     */
    "iconShape" : function( widget, value ) {
      if( value === null ) {
        widget.setIconShape( null, 0 );
      } else {
        var cut = value.indexOf( "|" );
        widget.setIconShape( value.substring( cut + 1 ), parseInt( value.substring( 0, cut ), 10 ) );
      }
    },
    /*
     * Colore e font del secondo testo. Arrivano come valore "user" e quindi vincono su quello
     * dell'appearance, che resta il default del tema: un null qui rimette il valore del tema
     * invece di spegnere lo stile.
     */
    "secondaryForeground" : function( widget, value ) {
      if( value === null ) {
        widget.resetSecondaryTextColor();
      } else {
        widget.setSecondaryTextColor( rwt.util.Colors.rgbToRgbString( value ) );
      }
    },
    "secondaryFont" : function( widget, value ) {
      if( value === null ) {
        widget.resetSecondaryFont();
      } else {
        widget.setSecondaryFont( rwt.html.Font.fromArray( value ) );
      }
    }
  } ),

  events : [ "Selection" ],

  listeners : rwt.remote.HandlerUtil.extendControlListeners( [] ),

  listenerHandler : rwt.remote.HandlerUtil.extendControlListenerHandler( {} ),

  methods: [ "addListener", "removeListener" ],

  methodHandler : rwt.remote.HandlerUtil.extendListenerMethodHandler( {} ),

  /**
   * @class RWT Scripting analoge to org.eclipse.swt.widgets.Button
   * @name Button
   * @extends Control
   * @description The constructor is not public.
   * @since 2.2
   */
  scriptingMethods : rwt.remote.HandlerUtil.extendControlScriptingMethods(
    /** @lends Button.prototype */
  {
    /**
     * @description  Returns the widget text.
     * @return {string} the widget text
     */
    getText : function() {
      return this.getCellContent( 2 );
    },
    /**
     * @description Returns <code>true</code> if the receiver is selected,
     * and false otherwise.
     * <p>
     * When the receiver is of type <code>CHECK</code> or <code>RADIO</code>,
     * it is selected when it is checked. When it is of type <code>TOGGLE</code>,
     * it is selected when it is pushed in. If the receiver is of any other type,
     * this method returns false.
     *</p>
     * @return {boolean} the selection state
     */
    getSelection : function() {
      return this.hasState( "selected" );
    }
  } )

} );

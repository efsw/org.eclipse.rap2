/*******************************************************************************
 * Copyright (c) 2010, 2020 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 ******************************************************************************/

/**
 * Represents a visible TreeItem.
 */

(function( $ ) {

var cellRenderer = rwt.widgets.util.CellRendererRegistry.getInstance().getAll();
var FADED = 0.3;

rwt.qx.Class.define( "rwt.widgets.base.GridRow", {

  extend : rwt.qx.Target,

  construct : function() {
    this.base( arguments );
    this.$el = $( "<div>" ).css( {
      "overflow" : "hidden",
      "userSelect" : "none",
      "height" : 16,
      "position" : "relative",
      "borderWidth" : "0px",
      "borderStyle" : "solid"
    });
    this.$el.prop( "row", this );
    this._styleMap = {};
    this._appearance = null;
    this._overlayStyleMap = {};
    this._elementStyleCache = {};
    this._variant = null;
    this.$expandIcon = null;
    this.$checkBox = null;
    this.$overlay = null;
    this.$treeColumnParts = [];
    this._lastAttributes = {};
    this._cssClasses = null;
    this.$cellLabels = [];
    this.$cellImages = [];
    this.$cellCheckBoxes = [];
    this.$cellBackgrounds = [];
    this.$cellBoxes = [];
    this.$indentIcons = [];
    this._usedIdentIcons = 0;
    this._cellsRendered = 0;
    this._templateRenderer = null;
    this._mirror = false;
  },

  destruct : function() {
    this.$el.removeProp( "row" ).detach();
    this.$el = null;
    this.$expandIcon = null;
    this.$checkBox = null;
    this.$treeColumnParts = null;
    this.$cellLabels = null;
    this.$cellImages = null;
    this.$cellCheckBoxes = null;
    this.$cellBackgrounds = null;
    this.$cellBoxes = null;
    this.$indentIcons = null;
    this._item = null;
    this._gridConfig = null;
    this._hoverTarget = null;
    this._layout = null;
  },

  members : {

    _gridLines : { horizontal : null, vertical : null },

    renderItem : function( item, gridConfig, selected, hoverTarget, contentOnly ) {
      this._item = item;
      this._gridConfig = gridConfig;
      this._selected = this._renderAsSelected( gridConfig, selected );
      this._hoverTarget = hoverTarget;
      this._columnSpans = this._getColumnSpans( item );
      this._contentOnly = contentOnly && this._oldColumnSpans === this._columnSpans;
      this._oldColumnSpans = this._columnSpans;
      this._layout = new rwt.widgets.util.GridRowLayout( gridConfig, item );
      this._renderStates();
      this._renderItemBackground();
      this._renderItemForeground();
      this._renderItemFont();
      this._renderIndention();
      this._renderContent();
      this._renderHeight();
      this._renderOverlay();
      this._renderHtmlAttributes();
      this._renderCssClasses();
      this._renderAriaAttributes();
      this.dispatchSimpleEvent( "itemRendered", item );
    },

    /**
     * Writes the css classes of the row: "rwt-GridRow", one class per state, and the custom
     * variant of the item. Rows are recycled while scrolling, so the value is compared with the
     * last one to keep the number of DOM writes down.
     */
    _renderCssClasses : function() {
      var Widget = rwt.widgets.base.Widget;
      var classes = [ "rwt-GridRow" ];
      if( this.__states ) {
        for( var state in this.__states ) {
          classes.push( Widget.getCssStateClass( state ) );
        }
      }
      var custom = this._lastAttributes[ "class" ];
      if( custom ) {
        classes.push( custom );
      }
      var value = classes.join( " " );
      if( this._cssClasses !== value ) {
        this._cssClasses = value;
        this.$el.attr( "class", value );
      }
    },

    _renderAriaAttributes : function() {
      var item = this._item;
      if( !item ) {
        return;
      }
      var attributes = {
        "role" : "row",
        "aria-selected" : this._selected ? "true" : "false"
      };
      // Depth and expansion state only mean something in a tree, where the rows form a hierarchy.
      if( this._gridConfig.baseAppearance !== "table" ) {
        attributes[ "aria-level" ] = item.getLevel() + 1;
        if( item.hasChildren() ) {
          attributes[ "aria-expanded" ] = item.isExpanded() ? "true" : "false";
        } else {
          this.$el.removeAttr( "aria-expanded" );
        }
      }
      this.$el.attr( attributes );
    },

    identify : function( node ) {
      var cell = $( node ).attr( "data-cell-index" );
      cell = cell !== undefined ? parseInt( cell, 10 ) : -1;
      var result = [ "other", cell ];
      var match = function( candidate ) {
        return candidate != null && candidate.is( node );
      };
      if( match( this.$expandIcon ) ) {
        result = [ "expandIcon", cell ];
      } else if( match( this.$checkBox ) ) {
        result = [ "checkBox" ];
      } else if( this.$cellCheckBoxes.some( match ) ) {
        result = [ "cellCheckBox", cell ];
      } else {
        while( !this.$el.is( node ) && result[ 0 ] === "other" ) { // Can be removed?
          if( this.$treeColumnParts.some( match ) ) {
            result = [ "treeColumn", cell ]; // TODO [tb] : now should be [ "label", 0 ] / [ "image", 0 ]
          } else if( this._templateRenderer ) {
            if( this._templateRenderer.isCellSelectable( node ) ) {
              result = [ "selectableCell", this._templateRenderer.getCellName( node ) ];
            }
          }
          node = node.parentNode;
        }
      }
      return result;
    },

    updateEvenState : function( index ) {
      this.setState( "even", index % 2 === 0 );
    },

    setAppearance : function( appearance ) {
      this._appearance = appearance;
    },

    getAppearance : function() {
      return this._appearance;
    },

    setWidth : function( width ) {
      this.$el.css( "width", width );
    },

    setHeight : function( height ) {
      this.$el.css( "height", height );
    },

    getTop : function() {
      return this.$el.get( 0 ).offsetTop;
    },

    getWidth : function() {
      // Do NOT use anything like offsetWidth/outerWidth/clientRectBounds for this, it would
      // force rendering and potentially impact performance!
      return Math.round( parseFloat( this.$el.css( "width" ) || "0" ) );
    },

    getHeight : function() {
      // Note: Recent versions of Chrome return float value.
      // To avoid 1px precision lost parse it first as float and than round it.
      return Math.round( parseFloat( this.$el.css( "height" ) || "0" ) );
    },

    getNextIndentOffset : function() {
      if( this._item && this._gridConfig.treeColumn !== -1 ) {
        return ( this._item.getLevel() + 1 ) * this._gridConfig.indentionWidth;
      }
      return 0;
    },

    renderHeight : function( item, gridConfig ) {
      this._renderHeight( { item: item, gridConfig: gridConfig } );
    },

    setState : function( state, value ) {
      if( !this.__states ) {
        this.__states = {};
      }
      if( value ) {
        this.__states[ state ] = true;
      } else {
        delete this.__states[ state ];
      }
    },

    hasState : function( state ) {
      return this.__states && this.__states[ state ] ? true : false;
    },

    setGridLines : function( lines ) {
      this._gridLines = lines;
      this.$el.css( {
        "borderBottomColor" : lines.horizontal || "",
        "borderBottomWidth" : lines.horizontal ? "1px" : "0px"
      } );
      for( var cell = 0; cell < this.$cellBackgrounds.length; cell++ ) {
        this._renderVerticalGridLine( cell );
      }
    },

    getGridLines : function() {
      return this._gridLines;
    },

    setMirror : function( mirror ) {
      this._mirror = mirror;
      for( var cell = 0; cell < this.$cellBackgrounds.length; cell++ ) {
        this._renderVerticalGridLine( cell );
      }
    },

    getMirror : function() {
      return this._mirror;
    },

    getItem : function() {
      return this._item;
    },

    ///////////////////////
    // First-level Renderer

    _renderStates : function() {
      if( this._item ) {
        this.setState( "rowtemplate", this._gridConfig.rowTemplate != null );
        this.setState( "checked", this._item.isChecked() );
        this.setState( "grayed", this._item.isGrayed() );
        this.setState( "parent_unfocused", this._renderAsUnfocused( this._gridConfig ) );
        this.setState( "selected", this._gridConfig.fullSelection ? this._selected : false );
        this._renderVariantState( this._item.getVariant() );
        this._renderOverState( this._hoverTarget, this._gridConfig );
        this._styleMap = this._getStyleMap();
        this.setState( "selected", this._selected );
        if( this._gridConfig.fullSelection ) {
          this._overlayStyleMap = this._getOverlayStyleMap( this._selected );
        } else {
          this._overlayStyleMap = this._getTreeColumnStyleMap( this._selected );
        }
      }
    },

    _renderItemBackground : function() {
      var color, image, gradient;
      if( this._item ) {
        if( this._item.getBackground() !== null && this._gridConfig.enabled !== false ) {
          color = this._item.getBackground();
        } else {
          color = this._styleMap.background;
          image = this._styleMap.backgroundImage;
          gradient = this._styleMap.backgroundGradient;
        }
      }
      // Note: "undefined" is a string stored in the themestore
      this.$el.css( {
        "backgroundColor" :  color !== "undefined" ? color : "",
        "backgroundImage" : image !== "undefined" ? image : "",
        "backgroundGradient" : gradient !== "undefined" ? gradient : ""
      } );
    },

    _renderItemForeground : function() {
      // TODO [tb] : could be inherited
      this.$el.css( "color", this._getItemColor() || "" );
    },

    _renderItemFont : function() {
      // TODO [tb] : could be inherited
      if( this._elementStyleCache.font !== this._gridConfig.font ) {
        this._elementStyleCache.font = this._gridConfig.font;
        this._setFont( this.$el, this._gridConfig.font );
      }
      if( this._elementStyleCache.textDecoration !== this._styleMap.textDecoration ) {
        this._elementStyleCache.textDecoration = this._styleMap.textDecoration;
        var decoration = this._styleMap.textDecoration;
        this.$el.css( {
          "textDecoration" : ( decoration == null || decoration === "none" ) ? "" : decoration
        } );
      }
      if( this._elementStyleCache.textOverflow !== this._styleMap.textOverflow ) {
        this._elementStyleCache.textOverflow = this._styleMap.textOverflow;
        var overflow = this._styleMap.textOverflow;
        this.$el.css( "textOverflow", ( overflow == null || overflow === "clip" ) ? "" : overflow );
      }
      if( this._elementStyleCache.textShadow !== this._styleMap.textShadow ) {
        this._elementStyleCache.textShadow = this._styleMap.textShadow;
        this.$el.css( "textShadow", this._styleMap.textShadow || "" );
      }
    },

    // TODO: broken on first render
    _renderIndention : function() {
      this._usedIdentIcons = 0;
      if( this._item && this._gridConfig.treeColumn !== -1 ) {
        this._renderExpandImage();
        this._renderLineImages();
      }
      for( var i = this._usedIdentIcons; i < this.$indentIcons.length; i++ ) {
        this.$indentIcons[ i ].css( "display", "none" );
      }
    },

    _renderContent : function() {
      if( this._gridConfig.rowTemplate ) {
        this._renderTemplate();
      } else {
        if( this._gridConfig.hasCheckBoxes ) {
          this._renderCheckBox();
        }
        this._renderCells();
      }
    },

    _renderHeight : function() {
      if( this._item ) {
        if( this._gridConfig.autoHeight && !this._gridConfig.splitContainer ) {
          var computedHeight = this.computeAutoHeight();
          if( this._item.getDefaultHeight() >= computedHeight - 1 ) {
            computedHeight = null; // ignore rounding error for network optimization
          }
          this._item.setHeight( computedHeight, true );
        }
        var itemHeight = this._item.getOwnHeight();
        if( itemHeight !== this.getHeight() ) {
          this.$el.css( "height", this._item.getOwnHeight() );
        }
      }
    },

    _renderOverlay : function() {
      if( this._item && this._hasOverlayBackground( this._gridConfig ) ) {
        var gradient = this._overlayStyleMap.backgroundGradient;
        if( gradient ) {
          this._getOverlayElement().css( "backgroundGradient", gradient || "" );
        } else {
          this._getOverlayElement().css( {
            "backgroundColor" : this._overlayStyleMap.background,
            "opacity" : this._overlayStyleMap.backgroundAlpha
        } );
        }
        this._renderOverlayBounds();
      } else if( this.$overlay ){
        this.$overlay.css( "display", "none" );
      }
    },

    _renderHtmlAttributes : function() {
      this.$el.removeAttr( Object.keys( this._lastAttributes ).join( " " ) );
      var attributes = this._item ? this._item.getHtmlAttributes() : {};
      if( attributes[ "id" ] && this._gridConfig.containerNumber === 1 ) {
        attributes = rwt.util.Objects.copy( attributes );
        attributes[ "id" ] += "-1";
      }
      this.$el.attr( attributes );
      this._lastAttributes = attributes;
    },

    ///////////////////
    // Content Renderer

    _renderTemplate : function() {
      var xOffset = this._layout.indention;
      var yOffset = 0;
      var width = this.getWidth() - xOffset - this._gridConfig.vBarWidth;
      var height = this.getHeight();
      var renderer = this._getTemplateRenderer( this._gridConfig );
      renderer.targetBounds = [ xOffset, yOffset, width, height ];
      renderer.markupEnabled = this._gridConfig.markupEnabled;
      renderer.targetIsEnabled = this._gridConfig.enabled;
      renderer.targetIsSeeable = this._gridConfig.seeable;
      renderer.renderItem( this._item );
    },

    _getTemplateRenderer : function( gridConfig ) {
      if( this._templateRenderer == null ) {
        this._templateRenderer = new rwt.widgets.util.TemplateRenderer(
          gridConfig.rowTemplate,
          this.$el.get( 0 ),
          100
        );
      }
      return this._templateRenderer;
    },

    _renderCheckBox : function() {
      var image = this._getCheckBoxImage();
      this._getCheckBoxElement().css( {
        "display" : image === null ? "none" : "",
        "opacity" : this._gridConfig.enabled ? 1 : FADED,
        "backgroundImage" : image || ""
      } );
      var isTree = this._gridConfig.treeColumn !== -1;
      if( this._item && ( isTree || !this._contentOnly ) ) {
        this._renderCheckBoxBounds();
      }
    },

    _renderCells : function() {
      var columns = this._getColumnCount( this._gridConfig );
      if( this._cellsRendered > columns ) {
        this._removeCells( columns, this._cellsRendered );
      }
      for( var cell = 0; cell < columns; cell++ ) {
        if( this._layout.cellWidth[ cell ] > 0 ) {
          if( this._gridConfig.cellSelection && this._item && this._item.isCellSelected( cell ) ) {
            this._renderCellSelectionColor( cell );
          } else {
            this._renderCellBackground( cell );
          }
          this._renderCellBoxStyle( cell );
          this._renderCellCheckBox( cell );
          this._renderCellImage( cell );
          this._renderCellLabel( cell );
          if( !this._gridConfig.fullSelection && this._isTreeColumn( cell ) ) {
            this.$treeColumnParts = [ this.$cellImages[ cell ], this.$cellLabels[ cell ] ];
          }
        } else {
          this._removeCell( cell );
        }
      }
      this._cellsRendered = columns;
    },

    _renderCellSelectionColor : function( cell ) {
      var gradient = this._overlayStyleMap.backgroundGradient;
      if( gradient ) {
        this._getCellBackgroundElement( cell ).css( "backgroundGradient", gradient || "" );
      } else {
        this._getCellBackgroundElement( cell ).css( {
          "backgroundColor" : this._overlayStyleMap.background,
          "opacity" : this._overlayStyleMap.backgroundAlpha
        } );
      }
      this._renderCellBackgroundBounds( cell );
    },

    _renderCellBackground : function( cell ) {
      var background = this._getCellBackgroundColor( cell );
      var renderBounds = false;
      if( background !== "undefined" && background != this._styleMap.backgroundColor ) {
        renderBounds = !this._contentOnly || !this.$cellBackgrounds[ cell ];
        this._getCellBackgroundElement( cell ).css( {
          "backgroundGradient" : "",
          "backgroundColor" : background,
          "opacity" : ""
        } );
      } else if(    this.$cellBackgrounds[ cell ]
                 || this._gridLines.vertical
                 || this._gridConfig.cellSelection )
      {
        this._getCellBackgroundElement( cell ).css( {
          "backgroundColor" : "",
          "opacity" : ""
        } );
        renderBounds = !this._contentOnly;
      }
      if( renderBounds ) {
        this._renderCellBackgroundBounds( cell );
      }
    },

    _renderCellCheckBox : function( cell ) {
      if( this._gridConfig.itemCellCheck[ cell ] ) {
        var image = this._getCellCheckBoxImage( cell );
        var isTreeColumn = this._isTreeColumn( cell );
        var renderBounds = isTreeColumn || !this._contentOnly || !this.$cellCheckBoxes[ cell ];
        this._getCellCheckBoxElement( cell ).css( {
          "display" : image === null ? "none" : "",
          "opacity" : this._gridConfig.enabled ? 1 : FADED,
          "backgroundImage" : image || ""
        } );
        if( renderBounds ) {
          this._renderCellCheckBounds( cell );
        }
      } else if( this.$cellCheckBoxes[ cell ] ) {
        this._getCellCheckBoxElement( cell ).css( "display", "none" );
      }
    },

    _renderCellImage : function( cell ) {
      var source = this._item ? this._item.getImage( cell ) : null;
      var isTreeColumn = this._isTreeColumn( cell );
      var renderBounds = isTreeColumn || !this._contentOnly;
      if( source !== null ) {
        renderBounds = renderBounds || !this.$cellImages[ cell ];
        this._getCellImageElement( cell ).css( {
          "opacity" : this._gridConfig.enabled ? 1 : FADED,
          "backgroundImage" : source[ 0 ] || ""
        } );
      } else if( this.$cellImages[ cell ] ) {
        this._getCellImageElement( cell ).css( { "backgroundImage" : "" } );
      }
      if( renderBounds ) {
        this._renderCellImageBounds( cell );
      }
    },

    _renderCellLabel : function( cell ) {
      var element = null;
      var isTreeColumn = this._isTreeColumn( cell );
      var renderBounds = isTreeColumn || !this._contentOnly;
      if( this._item && this._item.hasText( cell ) ) {
        renderBounds = renderBounds || !this.$cellLabels[ cell ];
        element = this._getCellLabelElement( cell );
        this._renderCellLabelContent( cell, element );
        if( renderBounds ) {
          element.css( "textAlign", this._getEffectiveAlignment( cell ) );
        }
        this._renderCellLabelFont( cell, element );
      } else if( this.$cellLabels[ cell ] ) {
        element = this._getCellLabelElement( cell );
        this._renderCellLabelContent( -1, element );
      }
      if( element ) {
        // dopo il contenuto: renderContent sostituisce quello che c'e' dentro l'elemento
        this._renderCellStyle( cell, element );
      }
      if( renderBounds ) {
        this._renderCellLabelBounds( cell );
      }
    },

    _renderCellLabelContent : function( cell, element ) {
      var options = {
        "markupEnabled" : this._gridConfig.markupEnabled,
        "seeable" : this._gridConfig.seeable,
        "removeNewLines" : true
      };
      var item = this._item ? this._item.getText( cell ) : null;
      cellRenderer.text.renderContent( element.get( 0 ), item, null, options );
    },

    _renderCellLabelFont : function( cell, element ) {
      element.css( {
        "color" : this._getCellColor( cell ) || "",
        "whiteSpace" : this._gridConfig.wordWrap[ cell ] ? "" : "nowrap"
      } );
      this._setFont( element, this._item.getCellFont( cell ) );
    },

    /////////////////
    // Content Getter

    _getCheckBoxImage : function() {
      if( !this._item ) {
        return null;
      }
      this.setState( "over", this._hoverTarget && this._hoverTarget[ 0 ] === "checkBox" );
      this.setState( "disabled", !this._item.isCellCheckable( 0 ) );
      var image = this._getImageFromAppearance( "check-box", this.__states );
      this.setState( "over", this._hoverTarget !== null );
      this.setState( "disabled", false );
      return image;
    },

    _getCellCheckBoxImage : function( cell ) {
      if( !this._item ) {
        return null;
      }
      this.setState( "checked", this._item.isCellChecked( cell ) );
      this.setState( "disabled", !this._item.isCellCheckable( cell ) );
      this.setState( "grayed", this._item.isCellGrayed( cell ) );
      this.setState( "over",    this._hoverTarget
                             && this._hoverTarget[ 0 ] === "cellCheckBox"
                             && this._hoverTarget[ 1 ] === cell );
      var image = this._getImageFromAppearance( "check-box", this.__states );
      this.setState( "disabled", false );
      return image;
    },

    _getCellBackgroundColor : function( cell ) {
      if( !this._item || this._gridConfig.enabled === false ) {
        return "undefined";
      }
      return this._item.getCellBackground( cell );
    },

    _getItemColor : function() {
      var result = "undefined";
      if( this._gridConfig.fullSelection ) {
        result = this._overlayStyleMap.foreground;
      }
      if( result === "undefined" ) {
        result = this._styleMap.foreground;
      }
      if( result === "undefined" ) {
        result = this._gridConfig.textColor;
      }
      if( result === "undefined" ) {
        result = "inherit";
      }
      return result;
    },

    _getCellColor : function( cell ) {
      var treeColumn = this._isTreeColumn( cell );
      var allowOverlay = this._gridConfig.fullSelection || treeColumn;
      var result = allowOverlay ? this._overlayStyleMap.foreground : "undefined";
      if(    result === "undefined"
          && this._gridConfig.enabled !== false
          && this._item.getCellForeground( cell )
      ) {
        result = this._item.getCellForeground( cell );
      }
      if( result === "undefined" && treeColumn && !this._gridConfig.fullSelection ) {
        // If there is no overlay the tree column foreground may still have a different color
        // due to selection. In this case _overlayStyleMap has the tree column foreground color.
        result = this._overlayStyleMap.rowForeground;
      }
       if( result === "undefined" ) {
         result = "inherit";
      }
      return result;
    },

    //////////////////
    // Layout Renderer

    _renderCheckBoxBounds : function() {
      var left = this._layout.checkBoxLeft;
      var width = this._layout.checkBoxWidth;
      this.$checkBox.css( {
        "left" : this._mirror ? "" : left,
        "right" : this._mirror ? left : "",
        "top" : 0,
        "width" : width,
        "height" : "100%"
      } );
    },

    _renderCellBackgroundBounds : function( cell ) {
      var element = this.$cellBackgrounds[ cell ];
      if( element ) {
        var left = this._layout.cellLeft[ cell ];
        element.css( {
          "left" : this._mirror ? "" : left,
          "right" : this._mirror ? left : "",
          "top" : 0,
          "width" : this._layout.cellWidth[ cell ],
          "height" : "100%"
        } );
      }
    },

    _renderCellCheckBounds : function( cell ) {
      var element = this.$cellCheckBoxes[ cell ];
      if( element ) {
        var left = this._layout.cellCheckLeft[ cell ];
        var width = this._layout.cellCheckWidth[ cell ];
        element.css( {
          "left" : this._mirror ? "" : left,
          "right" : this._mirror ? left : "",
          "top" : 0,
          "width" : width,
          "height" : "100%"
        } );
      }
    },

    _renderCellImageBounds : function( cell ) {
      var element = this.$cellImages[ cell ];
      if( element ) {
        var left = this._layout.cellImageLeft[ cell ];
        var width = this._layout.cellImageWidth[ cell ];
        element.css( {
          "left" : this._mirror ? "" : left,
          "right" : this._mirror ? left : "",
          "top" : 0,
          "width" : width,
          "height" : "100%"
        } );
      }
    },

    /**
     * Applies the cell css declarations to an inner element that wraps the text.
     *
     * The element the client positions - the cell label - is not ours: _renderCellLabelBounds
     * rewrites its left, top and width on every render, so anything geometric written on it is
     * recomputed away. The inner element is never touched by the layout, so it can carry padding,
     * a border, a radius and a background, and it sizes itself on its content: that is what makes
     * a badge a badge instead of a coloured column.
     *
     * It is applied after the content, because renderContent replaces whatever is inside the
     * label - so the wrapper has to be put back on every render.
     */
    /**
     * Applies the cell box css declarations to an element of ours, stacked over the cell: the
     * height of the row, the width of the column.
     *
     * The obvious candidate would have been the per cell background element, which already has
     * exactly those bounds. Two things make it the wrong place, and both are silent:
     *
     * - the whole background family on that element belongs to rwt.html.Style, which keeps its own
     *   bookkeeping of colour, gradient, image, position and repeat and rebuilds the background
     *   shorthand from it whenever any of them changes. A background-image written there survives
     *   until the next time the cell colour is rendered, and then disappears - which also rules
     *   out expressing anything as a background, so a rule taking a fraction of the height, which
     *   needs background-size, could not be drawn at all;
     * - it sits at z-index 1 and the selection overlay at 2, so everything drawn on it is covered
     *   as soon as the row is selected.
     *
     * This element instead is ours: it exists only for a cell that declares a box style, its
     * inline style is rewritten whole on every render because nobody else writes on it, and it
     * sits at z-index 3, over the selection overlay. It is created before the cell label, so the
     * text still paints over it where the two meet, and pointer-events none keeps it out of hit
     * testing - it covers the cell, and must not take its clicks.
     */
    _renderCellBoxStyle : function( cell ) {
      var style = this._item ? this._item.getCellBoxStyle( cell ) : null;
      if( !style ) {
        this._removeNode( this.$cellBoxes, cell );
        return;
      }
      var node = this._getCellBoxElement( cell ).get( 0 );
      if( !node ) {
        return;
      }
      var left = this._layout.cellLeft[ cell ];
      node.style.cssText =   "position:absolute;overflow:hidden;pointer-events:none;z-index:3;"
                           + "top:0;height:100%;width:" + this._layout.cellWidth[ cell ] + "px;"
                           + ( this._mirror ? "right:" : "left:" ) + left + "px;"
                           + style;
    },

    _getCellBoxElement : function( cell ) {
      var result = this.$cellBoxes[ cell ];
      if( !result ) {
        result = this._createElement( 3 );
        this.$cellBoxes[ cell ] = result;
      }
      return result;
    },

    _renderCellStyle : function( cell, element ) {
      var node = element.get( 0 );
      if( !node ) {
        return;
      }
      var style = this._item ? this._item.getCellStyle( cell ) : null;
      var wrapper = node.firstChild;
      var isWrapper =    wrapper
                      && wrapper.nodeType === 1
                      && wrapper.getAttribute
                      && wrapper.getAttribute( "data-rwt-cell" );
      if( !style ) {
        if( isWrapper ) {
          // torna al rendering semplice: il testo rientra direttamente nell'etichetta
          node.innerHTML = wrapper.innerHTML;
        }
        return;
      }
      if( !isWrapper ) {
        wrapper = document.createElement( "span" );
        wrapper.setAttribute( "data-rwt-cell", "1" );
        wrapper.innerHTML = node.innerHTML;
        node.innerHTML = "";
        node.appendChild( wrapper );
      }
      /*
       * inline-block perche' la scatola si stringa sul contenuto.
       *
       * max-width, overflow ed ellissi servono a non far tagliare la scatola: senza, un valore
       * piu' largo della colonna sporge e l'overflow dell'etichetta ne mangia il bordo destro,
       * cioe' si perde proprio il pezzo che rende la forma riconoscibile. Cosi' invece la scatola
       * si ferma alla larghezza utile e a essere troncato e' il testo, dentro il bordo.
       *
       * Il box-sizing globale del client e' border-box, quindi max-width comprende bordo e
       * padding: la scatola sta nella colonna per intero.
       */
      wrapper.style.cssText = "display:inline-block;white-space:nowrap;line-height:normal;"
                            + "max-width:100%;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;"
                            + style;
    },

    _renderCellLabelBounds : function( cell ) {
      var element = this.$cellLabels[ cell ];
      if( element ) {
        var left = this._layout.cellTextLeft[ cell ];
        var width = this._layout.cellTextWidth[ cell ];
        /*
         * Centratura verticale, e vale per tutto cio' che sta su una riga: testo, pastiglie,
         * qualunque contenuto.
         *
         * L'etichetta partiva dal padding alto della cella, che e' un numero calibrato su una riga
         * di testo: qualunque contenuto piu' alto o piu' basso resta fuori asse, e in una riga
         * cresciuta per il font di un'altra cella il testo finisce appiccicato in cima - misurato,
         * 7px sopra e 51 sotto in una riga da 77.
         *
         * top al 50% piu' una traslazione di mezza altezza propria centra senza sapere quanto e'
         * alto il contenuto: nessuna misura da fare - che su una griglia virtuale sarebbe una
         * lettura di layout per cella - e nessun numero deciso in anticipo, quindi niente da
         * ritarare quando cambia il corpo del testo.
         *
         * Ed e' la ragione per cui non si usa flex, che sarebbe il modo ovvio: un elemento flex
         * perde text-overflow, e l'ellissi sparirebbe da ogni cella dell'applicazione. Restando un
         * blocco, text-align continua a posizionare sia il testo sia una scatola inline-block,
         * quindi l'allineamento dichiarato sulla colonna vale come sempre, forma compresa.
         *
         * Una colonna che va a capo resta ancorata in alto: centrare un blocco su tre righe
         * disallineerebbe la prima riga dalle celle a riga singola accanto, ed e' quell'
         * allineamento che rende leggibile un record.
         */
        if( !this._gridConfig.wordWrap[ cell ] ) {
          element.css( {
            "left" : this._mirror ? "" : left,
            "right" : this._mirror ? left : "",
            "top" : "50%",
            "width" : width,
            "height" : "auto",
            "transform" : "translateY(-50%)"
          } );
          return;
        }
        element.css( {
          "left" : this._mirror ? "" : left,
          "right" : this._mirror ? left : "",
          "top" : this._layout.cellPadding[ 0 ],
          "width" : width,
          "height" : "auto",
          "transform" : ""
        } );
      }
    },

    _renderOverlayBounds : function() { // TODO: broken on first render
      if( !this._gridConfig.fullSelection ) {
        var cell = this._gridConfig.treeColumn;
        var padding = this._gridConfig.selectionPadding;
        var left = this._layout.cellTextLeft[ cell ];
        left -= padding[ 0 ];
        var width = this._layout.cellTextWidth[ cell ];
        width += width > 0 ? padding[ 0 ] : 0;
        var visualWidth  = this._computeVisualTextWidth( cell );
        visualWidth  += padding[ 0 ] + padding[ 1 ];
        width = Math.min( width, visualWidth );
        this._getOverlayElement().css( {
          "left" : this._mirror ? "" : left,
          "right" : this._mirror ? left : "",
          "width" : width
        } );
      }
    },

    //////////////
    // Measurement

    computeAutoHeight : function() {
      var maxHeight = 0;
      for( var i = 0; i < this.$cellLabels.length; i++ ) {
        if( this.$cellLabels[ i ] ) {
          maxHeight = Math.max( maxHeight, Math.ceil( this.$cellLabels[ i ].outerHeight() ) );
        }
      }
      var padding = this._layout.cellPadding;
      return maxHeight + padding[ 0 ] + padding[ 2 ];
    },

    _computeVisualTextWidth : function( cell ) {
      var calc = rwt.widgets.util.FontSizeCalculation;
      var result = 0;
      if( this.$cellLabels[ cell ] ) {
        var font = this._getCellFont( cell );
        var fontProps = this._getFontProps( font );
        var text = this.$cellLabels[ cell ].html();
        var dimensions = calc.computeTextDimensions( text, fontProps );
        result = dimensions[ 0 ];
      }
      return result;
    },

    _getCellFont : function( cell ) {
      var result = this._item.getCellFont( cell );
      if( result === null || result === "" ) {
        result = this._gridConfig.font;
      }
      return result;
    },

    _getFontProps : function( font ) {
      var result = {};
      if( font instanceof rwt.html.Font ) {
        font.renderStyle( result );
      } else {
        var fontObject = rwt.html.Font.fromString( font );
        fontObject.renderStyle( result );
        fontObject.dispose();
      }
      return result;
    },

    /////////////////////
    // Indention Renderer

    _renderExpandImage : function() {
      var src = this._getExpandSymbol();
      if( src != null ) {
        this.$expandIcon = this._addIndentSymbol( this._item.getLevel(), this._gridConfig, src );
      } else {
        this.$expandIcon = null;
      }
    },

    _renderLineImages : function() {
      var src = this._getLineSymbol();
      if( src != null ) {
        var parent = this._item.getParent();
        while( !parent.isRootItem() ) {
          if( parent.hasNextSibling() ) {
            this._addIndentSymbol( parent.getLevel(), this._gridConfig, src );
          }
          parent = parent.getParent();
        }
      }
    },

    _getExpandSymbol : function() {
      var states = this._getParentStates( this._gridConfig );
      if( this._item.getLevel() === 0 && !this._item.hasPreviousSibling() ) {
        states.first = true;
      }
      if( !this._item.hasNextSibling() ) {
        states.last = true;
      }
      if( this._item.hasChildren() ) {
        if( this._item.isExpanded() ) {
          states.expanded = true;
        } else {
          states.collapsed = true;
        }
      }
      if( this._hoverTarget && this._hoverTarget[ 0 ] === "expandIcon" ) {
        states.over = true;
      }
      if( this._mirror ) {
        states.rwt_RIGHT_TO_LEFT = true;
      }
      return this._getImageFromAppearance( "indent", states );
    },

    _getLineSymbol : function() {
      var states = this._getParentStates( this._gridConfig );
      states.line = true;
      if( this._mirror ) {
        states.rwt_RIGHT_TO_LEFT = true;
      }
      return this._getImageFromAppearance( "indent", states );
    },

    _getParentStates : function( gridConfig ) {
      var result = {};
      if( gridConfig.variant ) {
        result[ gridConfig.variant ] = true;
      }
      return result;
    },

    _addIndentSymbol : function( level, gridConfig, source ) {
      var result = null;
      var nextLevelOffset = ( level + 1 ) * gridConfig.indentionWidth;
      var cellWidth = gridConfig.itemWidth[ gridConfig.treeColumn ];
      var cellLeft = gridConfig.itemLeft[ gridConfig.treeColumn ];
      if( nextLevelOffset <= cellWidth || gridConfig.rowTemplate ) {
        var offset = level * gridConfig.indentionWidth;
        var width = nextLevelOffset - offset;
        var element = this._getIndentImageElement().css( {
          "opacity" : gridConfig.enabled ? 1 : FADED,
          "backgroundImage" : source,
          "left" : this._mirror ? "" : cellLeft + offset,
          "right" : this._mirror ? cellLeft + offset : "",
          "top" : 0,
          "width" : width,
          "height" : "100%"
        } );
        element.attr( { "data-cell-index" : gridConfig.treeColumn } );
        result = element;
      }
      return result;
    },

    ///////////////////
    // Element Handling

    _getCheckBoxElement : function() {
      if( this.$checkBox === null ) {
        this.$checkBox = this._createElement( 3 ).css( {
          "backgroundRepeat" : "no-repeat",
          "backgroundPosition" : "center"
        } );
      }
      return this.$checkBox;
    },

    _getCellLabelElement : function( cell ) {
      var result = this.$cellLabels[ cell ];
      if( !result ) {
        result = this._createElement( 3 );
        result.css( {
          "textDecoration" : "inherit",
          "textOverflow": "inherit",
          "backgroundColor" : ""
        } );
        result.attr( { "data-cell-index" : cell } );
        this.$cellLabels[ cell ] = result;
      }
      return result;
    },

    _getCellImageElement : function( cell ) {
      var result = this.$cellImages[ cell ];
      if( !result ) {
        result = this._createElement( 3 );
        result.css( { "backgroundRepeat" : "no-repeat", "backgroundPosition" : "center" } );
        result.attr( { "data-cell-index" : cell } );
        this.$cellImages[ cell ] = result;
      }
      return result;
    },

    _getCellCheckBoxElement : function( cell ) {
      var result = this.$cellCheckBoxes[ cell ];
      if( !result ) {
        result = this._createElement( 3 );
        result.css( { "backgroundRepeat" : "no-repeat", "backgroundPosition" : "center" } );
        result.attr( { "data-cell-index" : cell } );
        this.$cellCheckBoxes[ cell ] = result;
      }
      return result;
    },

    _getOverlayElement : function() {
      if( this.$overlay === null ) {
        this.$overlay = this._createElement( 2 );
        this.$overlay.css( { "width" : "100%", "height" : "100%" } );
      }
      return this.$overlay.css( { "display" : "" } );
    },

    _getCellBackgroundElement : function( cell ) {
      var result = this.$cellBackgrounds[ cell ];
      if( !result ) {
        result = this._createElement( 1 ).css( {
          "borderWidth" : "0px",
          "borderStyle" : "solid"
        } );
        result.attr( { "data-cell-index" : cell } );
        this.$cellBackgrounds[ cell ] = result;
        this._renderVerticalGridLine( cell );
      }
      return result;
    },

    _renderVerticalGridLine : function( cell ) {
      var target = this.$cellBackgrounds[ cell ];
      if( target ) {
        target.css( {
          "borderRightWidth" : !this._mirror && this._gridLines.vertical ? "1px" : "0px",
          "borderLeftWidth" : this._mirror && this._gridLines.vertical ? "1px" : "0px",
          "borderColor" : this._gridLines.vertical || ""
        } );
      }
    },

    _getIndentImageElement : function() {
      var result;
      if( this._usedIdentIcons < this.$indentIcons.length ) {
        result = this.$indentIcons[ this._usedIdentIcons ];
      } else {
        result = this._createElement( 3 ).css( {
          "backgroundRepeat" : "no-repeat",
          "backgroundPosition" : "center",
          "zIndex" : 3
        } );
        this.$indentIcons.push( result );
      }
      this._usedIdentIcons++;
      return result.html( "" ).css( { "backgroundColor" : "", "display" : "" } );
    },

    _createElement : function( zIndex ) {
      return $( "<div>" ).css( {
        "position" : "absolute",
        "overflow" : "hidden",
        "zIndex" : zIndex
      } ).appendTo( this.$el );
    },

    _removeCells : function( from, to ) {
      for( var cell = from; cell < to; cell++ ) {
        this._removeCell( cell );
      }
    },

    _removeCell : function( cell ) {
      this._removeNode( this.$cellBackgrounds, cell );
      this._removeNode( this.$cellBoxes, cell );
      this._removeNode( this.$cellImages, cell );
      this._removeNode( this.$cellCheckBoxes, cell );
      this._removeNode( this.$cellLabels, cell );
    },

    _removeNode : function( arr, pos ) {
      var node = arr[ pos ];
      if( node ) {
        node.detach();
        arr[ pos ] = null;
      }
    },

    //////////////////
    // Theming Helper

    _getStyleMap : function() {
      var manager = rwt.theme.AppearanceManager.getInstance();
      return manager.styleFrom( this._appearance, this.__states );
    },

    _getOverlayStyleMap : function() {
      var manager = rwt.theme.AppearanceManager.getInstance();
      return manager.styleFrom( this._appearance + "-overlay", this.__states );
    },

    _getTreeColumnStyleMap : function( selected ) {
      var manager = rwt.theme.AppearanceManager.getInstance();
      var overlayMap = manager.styleFrom( this._appearance + "-overlay", this.__states );
      if( selected ) {
        var rowMap = manager.styleFrom( this._appearance, this.__states );
        overlayMap.rowForeground = rowMap.foreground;
      } else {
        overlayMap.rowForeground = "undefined";
      }
      return overlayMap;
    },

    _renderVariantState : function( variant ) {
      if( this._variant != variant ) {
        if( this._variant != null ) {
          this.setState( this._variant, false );
        }
        this._variant = variant;
        if( this._variant != null ) {
          this.setState( this._variant, true );
        }
      }
    },

    _renderOverState : function( hoverTarget, gridConfig ) {
      var fullOverState = hoverTarget !== null && gridConfig.fullSelection;
      var singleOverState = hoverTarget != null && hoverTarget[ 0 ] === "treeColumn";
      this.setState( "over", fullOverState || singleOverState );
    },

    _renderAsUnfocused : function( gridConfig ) {
      return !gridConfig.focused && !this.hasState( "dnd_selected" );
    },

    _renderAsSelected : function( gridConfig, selected ) {
      return    ( selected || this.hasState( "dnd_selected" ) )
             && ( !gridConfig.hideSelection || gridConfig.focused )
             && !gridConfig.alwaysHideSelection;
    },

    _hasOverlayBackground : function( gridConfig ) {
      if( !gridConfig.fullSelection && gridConfig.rowTemplate || gridConfig.cellSelection ) {
        return false;
      }
      return    this._overlayStyleMap.background !== "undefined"
             || this._overlayStyleMap.backgroundImage !== null
             || this._overlayStyleMap.backgroundGradient !== null;
    },

    _getImageFromAppearance : function( image, states ) {
      var appearance = this._appearance + "-" + image;
      var manager = rwt.theme.AppearanceManager.getInstance();
      var styleMap = manager.styleFrom( appearance, states );
      var valid = styleMap && styleMap.backgroundImage;
      return valid ? styleMap.backgroundImage : null;
    },

    _getColumnSpans : function( item ) {
      if( item ) {
        var spans = [];
        for( var i = 0; i < this._gridConfig.cellOrder.length; i++ ) {
          spans.push( item.getColumnSpan( this._gridConfig.cellOrder[ i ] ) );
        }
        return spans.join( "" );
      }
      return "";
    },

    /////////////
    // DOM Helper

    // TODO: integrate this in RWTQuery
    _setFont : function( element, font ) {
      if( font === "" || font === null ) {
        this._resetFont( element );
      } else {
        if( font instanceof rwt.html.Font ) {
          font.renderStyle( element.get( 0 ).style );
        } else {
          element.css( "font", font );
        }
      }
    },

    _resetFont : function( element ) {
      element.css( {
        "font" : "",
        "fontFamily" : "",
        "fontSize" : "",
        "fontVariant" : "",
        "fontStyle" : "",
        "fontWeight" : ""
      } );
    },

    ///////////////
    // Column Info

    /**
     * The alignment actually used for a cell, tree column included. Extracted because it is now
     * needed twice: as text-align, and as justify-content for a cell whose content is a box - in a
     * flex container text-align does not place the box, so without this the alignment declared on
     * the column would silently stop working on styled cells.
     */
    _getEffectiveAlignment : function( cell ) {
      var columnAlignment = this._getAlignment( cell, this._gridConfig );
      if( !this._isTreeColumn( cell ) || this._gridConfig.baseAppearance === "grid" ) {
        return columnAlignment;
      }
      return this._mirror ? "right" : "left";
    },

    _getAlignment : function( column, gridConfig ) {
      var alignment = gridConfig.alignment[ column ] ? gridConfig.alignment[ column ] : "left";
      if( this._mirror ) {
        if( alignment === "left" ) {
          return "right";
        } else if( alignment === "right" ) {
          return "left";
        }
      }
      return alignment;
    },

    _getColumnCount : function( gridConfig ) {
      return Math.max( 1, gridConfig.columnCount );
    },

    _isTreeColumn : function( cell ) {
      return cell === this._gridConfig.treeColumn;
    }

  }

} );

}( rwt.util._RWTQuery ));

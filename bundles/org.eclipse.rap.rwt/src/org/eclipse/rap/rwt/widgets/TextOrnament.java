/*******************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 ******************************************************************************/
package org.eclipse.rap.rwt.widgets;

import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.widgets.Listener;
import org.eclipse.swt.widgets.Text;


/**
 * Something a single line {@link Text} shows <b>inside its own edit area</b>, beside what the user
 * types: an icon, a short text, or both. A calendar at the right end of a date field, a warning
 * mark at the left, a grey "optional" that stays there while the value is edited.
 * <p>
 * The field makes room for it by itself: the area the user types in shrinks by the width of its
 * ornaments, and the preferred size of the field grows by the same amount.
 * </p>
 * <p>
 * An ornament with a listener is a small button: the pointer changes over it and a click reaches
 * the listener - {@link org.eclipse.swt.widgets.Event#text} is the {@link #getId() id},
 * {@link org.eclipse.swt.widgets.Event#widget} the field. It never takes the focus and is not a
 * tab stop: it is an extra for the mouse, like the two icons of a <code>SWT.SEARCH</code> field,
 * which is where this comes from.
 * </p>
 * <p>
 * An instance describes the ornament at the moment it is handed to
 * {@link Text#setOrnaments(TextOrnament...)}; to change it, change it and hand the list over
 * again.
 * </p>
 *
 * @see Text#setOrnaments(TextOrnament...)
 * @since 4.8
 */
public final class TextOrnament {

  private final String id;
  private final int position;
  private Image image;
  private String shape = "";
  private int shapeSize;
  private String text = "";
  private String toolTipText = "";
  private String style = "";
  private int width = SWT.DEFAULT;
  private Listener listener;

  /**
   * @param id what tells this ornament from the others of the same field, and what a click
   *        reports back
   * @param position <code>SWT.LEFT</code> or <code>SWT.RIGHT</code>: the end of the field the
   *        ornament sits at. Ornaments at the same end follow the order of the list
   */
  public TextOrnament( String id, int position ) {
    if( id == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    if( position != SWT.LEFT && position != SWT.RIGHT ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    this.id = id;
    this.position = position;
  }

  public String getId() {
    return id;
  }

  /**
   * @return <code>SWT.LEFT</code> or <code>SWT.RIGHT</code>
   */
  public int getPosition() {
    return position;
  }

  /**
   * @param image the icon, or <code>null</code> for none
   */
  public TextOrnament setImage( Image image ) {
    this.image = image;
    return this;
  }

  public Image getImage() {
    return image;
  }

  /**
   * An icon given as a css image instead of a registered {@link Image}: the same thing a
   * {@link org.eclipse.swt.widgets.Button#setIconShape(String, int) button} accepts. Ignored
   * when there is an image.
   *
   * @param shape a css url - <code>url("data:image/svg+xml,...")</code> - or an empty string
   * @param size the side of the square the shape is drawn in, in pixels
   */
  public TextOrnament setShape( String shape, int size ) {
    this.shape = shape == null ? "" : shape;
    this.shapeSize = Math.max( 0, size );
    return this;
  }

  public String getShape() {
    return shape;
  }

  public int getShapeSize() {
    return shapeSize;
  }

  /**
   * @param text a short text, shown after the icon when there is one. Plain text, not markup
   */
  public TextOrnament setText( String text ) {
    this.text = text == null ? "" : text;
    return this;
  }

  public String getText() {
    return text;
  }

  public TextOrnament setToolTipText( String toolTipText ) {
    this.toolTipText = toolTipText == null ? "" : toolTipText;
    return this;
  }

  public String getToolTipText() {
    return toolTipText;
  }

  /**
   * Css declarations written on the element of the ornament - a color, a background and a
   * radius make a pill out of it. They do not change the room the field keeps for it: an
   * ornament that pads itself says how wide it is with {@link #setWidth(int)}.
   *
   * @param style a css declaration list, or an empty string
   */
  public TextOrnament setStyle( String style ) {
    this.style = style == null ? "" : style;
    return this;
  }

  public String getStyle() {
    return style;
  }

  /**
   * @param width the room the field keeps for the ornament, in pixels, or
   *        <code>SWT.DEFAULT</code> for the width of its icon and text
   */
  public TextOrnament setWidth( int width ) {
    this.width = width;
    return this;
  }

  public int getWidth() {
    return width;
  }

  /**
   * @param listener who is told about a click, or <code>null</code> for an ornament that is
   *        only there to be seen
   */
  public TextOrnament setListener( Listener listener ) {
    this.listener = listener;
    return this;
  }

  public Listener getListener() {
    return listener;
  }

}

/*******************************************************************************
 * Copyright (c) 2002, 2019 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 ******************************************************************************/
package org.eclipse.swt.widgets;

import static org.eclipse.rap.rwt.internal.textsize.TextSizeUtil.getCharHeight;
import static org.eclipse.rap.rwt.internal.textsize.TextSizeUtil.textExtent;
import static org.eclipse.swt.internal.widgets.MarkupUtil.checkMarkupPrecondition;
import static org.eclipse.swt.internal.widgets.MarkupUtil.isMarkupEnabledFor;
import static org.eclipse.swt.internal.widgets.MarkupUtil.MarkupTarget.TEXT;
import static org.eclipse.swt.internal.widgets.MarkupValidator.isValidationDisabledFor;

import org.eclipse.rap.rwt.RWT;
import org.eclipse.rap.rwt.internal.lifecycle.WidgetLCA;
import org.eclipse.rap.rwt.internal.theme.Size;
import org.eclipse.rap.rwt.internal.theme.ThemeAdapter;
import org.eclipse.rap.rwt.theme.BoxDimensions;
import org.eclipse.swt.SWT;
import org.eclipse.swt.SWTException;
import org.eclipse.swt.events.SelectionEvent;
import org.eclipse.swt.events.SelectionListener;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.graphics.Font;
import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.graphics.Point;
import org.eclipse.swt.graphics.Rectangle;
import org.eclipse.swt.internal.widgets.MarkupValidator;
import org.eclipse.swt.internal.widgets.buttonkit.ButtonLCA;
import org.eclipse.rap.rwt.internal.theme.Size;
import org.eclipse.swt.internal.widgets.buttonkit.ButtonThemeAdapter;


/**
 * Instances of this class represent a selectable user interface object that
 * issues notification when pressed and released.
 * <dl>
 * <dt><b>Styles:</b></dt>
 * <dd><!--ARROW, -->CHECK, PUSH, RADIO, TOGGLE, FLAT, WRAP</dd>
 * <dd><!--UP, DOWN, -->LEFT, RIGHT, CENTER</dd>
 * <dt><b>Events:</b></dt>
 * <dd>Selection</dd>
 * </dl>
 * <p>
 * Note: Only one of the styles ARROW, CHECK, PUSH, RADIO, and TOGGLE
 * may be specified.
 * </p><p>
 * Note: Only one of the styles LEFT, RIGHT, and CENTER may be specified.
 * </p><p>
 * Note: Only one of the styles UP, DOWN, LEFT, and RIGHT may be specified
 * when the ARROW style is specified.
 * </p><p>
 * IMPORTANT: This class is intended to be subclassed <em>only</em>
 * within the SWT implementation.
 * </p>
 * @since 1.0
 */
public class Button extends Control {

  private String text = "";
  private String secondaryText = "";
  private boolean dropDown;
  private boolean vertical;
  private String iconShape = "";
  private int iconShapeSize;
  private Font secondaryFont;
  private Color secondaryForeground;
  private boolean selected;
  private boolean grayed;
  private Image image;
  private boolean isDefault;

  /**
   * Constructs a new instance of this class given its parent
   * and a style value describing its behavior and appearance.
   * <p>
   * The style value is either one of the style constants defined in
   * class <code>SWT</code> which is applicable to instances of this
   * class, or must be built by <em>bitwise OR</em>'ing together
   * (that is, using the <code>int</code> "|" operator) two or more
   * of those <code>SWT</code> style constants. The class description
   * lists the style constants that are applicable to the class.
   * Style bits are also inherited from superclasses.
   * </p>
   *
   * @param parent a composite control which will be the parent of the new instance (cannot be null)
   * @param style the style of control to construct
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - if the parent is null</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the parent</li>
   *    <li>ERROR_INVALID_SUBCLASS - if this class is not an allowed subclass</li>
   * </ul>
   *
   * <!--@see SWT#ARROW-->
   * @see SWT#CHECK
   * @see SWT#PUSH
   * @see SWT#RADIO
   * @see SWT#TOGGLE
   * @see SWT#FLAT
   * @see SWT#LEFT
   * @see SWT#RIGHT
   * @see SWT#CENTER
   * @see Widget#checkSubclass
   * @see Widget#getStyle
   */
  // TODO [rst] Remove comments from javadoc when fully implemented
  public Button( Composite parent, int style ) {
    super( parent, checkStyle( style ) );
  }

  @Override
  void initState() {
    if( ( style & ( SWT.PUSH | SWT.TOGGLE ) ) == 0 ) {
      addState( THEME_BACKGROUND );
    }
  }

  ////////////////
  // Getter/setter

  /**
   * Sets the receiver's text.
   * <p>
   * This method sets the button label.  The label may include
   * the mnemonic character but must not contain line delimiters.
   * </p>
   *
   * <p>
   * Mnemonics are indicated by an '&amp;' that causes the next
   * character to be the mnemonic.  When the user presses a
   * key sequence that matches the mnemonic, a selection
   * event occurs. On most platforms, the mnemonic appears
   * underlined but may be emphasised in a platform specific
   * manner.  The mnemonic indicator character '&amp;' can be
   * escaped by doubling it in the string, causing a single
   * '&amp;' to be displayed.
   * </p>
   *
   * @param text the new text
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - if the text is null</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setText( String text ) {
    checkWidget();
    if( text == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    if( ( style & SWT.ARROW ) == 0 ) {
      if( isMarkupEnabledFor( this ) && !isValidationDisabledFor( this ) ) {
        MarkupValidator.getInstance().validate( text );
      }
      this.text = text;
    }
  }

  /**
   * Returns the receiver's text, which will be an empty
   * string if it has never been set<!-- or if the receiver is
   * an <code>ARROW</code> button-->.
   *
   * @return the receiver's text
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  // TODO [rst] Remove comments from javadoc when fully implemented
  public String getText() {
    checkWidget();
    return text;
  }

  /**
   * Sets a second, secondary text on the receiver, shown after the main one with a style of its
   * own - the theme element <code>Button-SecondaryText</code> gives it its color and font.
   * <p>
   * It is meant for the piece of text that is not the command but says something about it: the
   * function key of a command bar button ("Save" / "F5"), a shortcut, a counter. Appending it to
   * the main text would give it the main text's color and weight, which is exactly what makes it
   * a second text.
   * </p>
   * <p>
   * The secondary text takes part in <code>computeSize</code>, measured with its own font, so the
   * preferred width of the button accounts for both texts.
   * </p>
   *
   * @param secondaryText the new secondary text, an empty string for none
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - if the text is null</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setSecondaryText( String secondaryText ) {
    checkWidget();
    if( secondaryText == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    if( ( style & SWT.ARROW ) == 0 ) {
      this.secondaryText = secondaryText;
    }
  }

  /**
   * Returns the receiver's secondary text, an empty string if it has never been set.
   *
   * @return the receiver's secondary text
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setSecondaryText(String)
   */
  public String getSecondaryText() {
    checkWidget();
    return secondaryText;
  }

  /**
   * Shows or hides the <b>drop down arrow</b>: the sign that says a menu opens from this button.
   * <p>
   * It is what a tool item with a menu shows by itself - there it is the DROP_DOWN style - and a
   * button has no such style, so it is a cell of its own at the right end. What the arrow looks
   * like is the theme's business, in the <code>Button-DropDownIcon</code> element: it is the same
   * sign in every button of an application, not a piece of data.
   * </p>
   * <p>
   * The arrow takes part in <code>computeSize</code> with the size the theme gives it, like the
   * check of a CHECK button: a button that shows it asks for more width.
   * </p>
   *
   * @param dropDown true to show the arrow
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setDropDown( boolean dropDown ) {
    checkWidget();
    this.dropDown = dropDown;
  }

  /**
   * Returns whether the drop down arrow is shown.
   *
   * @return true if the arrow is shown
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setDropDown(boolean)
   */
  public boolean getDropDown() {
    checkWidget();
    return dropDown;
  }

  /**
   * Lays the button's content out in a <b>column</b> instead of a row: the image on top and the
   * text below it.
   * <p>
   * It is what a tool item does in a toolbar without the <code>SWT.RIGHT</code> style, and there it
   * comes from the parent's style bits - fixed when the toolbar is created. A button has no such
   * style, so it is a property of its own and can be changed at any time.
   * </p>
   * <p>
   * Every cell follows: the image, the text, the secondary text and the drop down arrow are stacked
   * in that order, and <code>computeSize</code> adds the heights instead of the widths. The arrow's
   * own room moves with it - above the arrow instead of at its left - because that is where the
   * separator of its zone runs.
   * </p>
   *
   * @param vertical true to stack the cells, false to put them in a row
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setVertical( boolean vertical ) {
    checkWidget();
    this.vertical = vertical;
  }

  /**
   * Returns whether the button's content is laid out in a column.
   *
   * @return true if the cells are stacked
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setVertical(boolean)
   */
  public boolean getVertical() {
    checkWidget();
    return vertical;
  }

  /**
   * Sets a <b>shape</b> to be shown where the image goes: an inline SVG image, given as a css url,
   * with the side of the square it is drawn on.
   * <p>
   * It shares the image's place, and the image wins: the shape is what a style sheet declares and
   * the image what the program puts on top of it, so clearing the image brings the shape back. The
   * choice is made by the client, so it holds whatever the order in which the two arrive.
   * </p>
   * <p>
   * The shape takes part in <code>computeSize</code> with the side given here - it is an image, and
   * an image needs a size to make room for.
   * </p>
   *
   * @param iconShape the shape as a css url - <code>url("data:image/svg+xml,...")</code> - or an
   *        empty string for none
   * @param side the side of the shape, in pixels
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - if the shape is null</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setIconShape( String iconShape, int side ) {
    checkWidget();
    if( iconShape == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    this.iconShape = iconShape;
    this.iconShapeSize = side;
  }

  /**
   * Returns the shape shown where the image goes, an empty string if there is none.
   *
   * @return the shape as a css url
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setIconShape(String, int)
   */
  public String getIconShape() {
    checkWidget();
    return iconShape;
  }

  /**
   * Returns the side of the shape, in pixels.
   *
   * @return the side of the shape
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setIconShape(String, int)
   */
  public int getIconShapeSize() {
    checkWidget();
    return iconShapeSize;
  }

  /**
   * Sets the font of the secondary text, or <code>null</code> to use the one the theme element
   * <code>Button-SecondaryText</code> gives it.
   * <p>
   * The font is part of the measurement: <code>computeSize</code> measures the secondary text with
   * it, so a bolder or larger font here makes the button ask for more width. Setting it is
   * therefore the way to have a secondary text that differs in weight or size from the main one -
   * appending the text to the main one could never do that.
   * </p>
   *
   * @param secondaryFont the new font, or <code>null</code> for the themed one
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setSecondaryText(String)
   */
  public void setSecondaryFont( Font secondaryFont ) {
    checkWidget();
    if( secondaryFont != null && secondaryFont.isDisposed() ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    this.secondaryFont = secondaryFont;
  }

  /**
   * Returns the font of the secondary text, or <code>null</code> if it is the themed one.
   *
   * @return the font of the secondary text
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setSecondaryFont(Font)
   */
  public Font getSecondaryFont() {
    checkWidget();
    return secondaryFont;
  }

  /**
   * Sets the color of the secondary text, or <code>null</code> to use the one the theme element
   * <code>Button-SecondaryText</code> gives it.
   *
   * @param secondaryForeground the new color, or <code>null</code> for the themed one
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setSecondaryText(String)
   */
  public void setSecondaryForeground( Color secondaryForeground ) {
    checkWidget();
    if( secondaryForeground != null && secondaryForeground.isDisposed() ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    this.secondaryForeground = secondaryForeground;
  }

  /**
   * Returns the color of the secondary text, or <code>null</code> if it is the themed one.
   *
   * @return the color of the secondary text
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see #setSecondaryForeground(Color)
   */
  public Color getSecondaryForeground() {
    checkWidget();
    return secondaryForeground;
  }

  /**
   * Returns <code>true</code> if the receiver is selected,
   * and false otherwise.
   * <p>
   * When the receiver is of type <code>CHECK</code> or <code>RADIO</code>,
   * it is selected when it is checked. When it is of type <code>TOGGLE</code>,
   * it is selected when it is pushed in. If the receiver is of any other type,
   * this method returns false.
   *
   * @return the selection state
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public boolean getSelection() {
    checkWidget();
    boolean result = false;
    if( ( style & ( SWT.CHECK | SWT.RADIO | SWT.TOGGLE ) ) != 0 ) {
      result = selected;
    }
    return result;
  }

  /**
   * Sets the selection state of the receiver, if it is of type <code>CHECK</code>,
   * <code>RADIO</code>, or <code>TOGGLE</code>.
   *
   * <p>
   * When the receiver is of type <code>CHECK</code> or <code>RADIO</code>,
   * it is selected when it is checked. When it is of type <code>TOGGLE</code>,
   * it is selected when it is pushed in.
   *
   * @param selected the new selection state
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setSelection( boolean selected ) {
    checkWidget();
    if( ( style & ( SWT.CHECK | SWT.RADIO | SWT.TOGGLE ) ) != 0 ) {
      this.selected = selected;
    }
  }

  /**
   * Returns <code>true</code> if the receiver is grayed,
   * and false otherwise. When the widget does not have
   * the <code>CHECK</code> style, return false.
   *
   * @return the grayed state of the checkbox
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @since 1.2
   */
  public boolean getGrayed () {
    checkWidget();
    boolean result = false;
    if( ( style & SWT.CHECK ) != 0 ) {
      result = grayed;
    }
    return result;
  }

  /**
   * Sets the grayed state of the receiver.  This state change
   * only applies if the control was created with the SWT.CHECK
   * style.
   *
   * @param grayed the new grayed state
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @since 1.2
   */
  public void setGrayed( boolean grayed ) {
    checkWidget();
    if( ( style & SWT.CHECK ) != 0 ) {
      this.grayed = grayed;
    }
  }

  /**
   * Returns the receiver's image if it has one, or null
   * if it does not.
   *
   * @return the receiver's image
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public Image getImage() {
    checkWidget();
    return image;
  }

  /**
   * Sets the receiver's image to the argument, which may be
   * <code>null</code> indicating that no image should be displayed.
   *
   * @param image the image to display on the receiver (may be <code>null</code>)
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_INVALID_ARGUMENT - if the image has been disposed</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  public void setImage( Image image ) {
    checkWidget();
    if( image != null && image.isDisposed() ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    if( ( style & SWT.ARROW ) == 0 ) {
      this.image = image;
    }
  }

  /**
   * Returns a value which describes the position of the
   * text or image in the receiver. The value will be one of
   * <code>LEFT</code>, <code>RIGHT</code> or <code>CENTER</code>
   * unless the receiver is an <code>ARROW</code> button, in
   * which case, the alignment will indicate the direction of
   * the arrow (one of <code>LEFT</code>, <code>RIGHT</code>,
   * <code>UP</code> or <code>DOWN</code>)
   *
   * @return the alignment
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
  // TODO [rst] Remove comments from javadoc when fully implemented
  public int getAlignment() {
    checkWidget();
    int result;
    if( ( style & SWT.ARROW ) != 0 ) {
      if( ( style & SWT.UP ) != 0 ) {
        result = SWT.UP;
      } else if( ( style & SWT.DOWN ) != 0 ) {
        result = SWT.DOWN;
      } else if( ( style & SWT.LEFT ) != 0 ) {
        result = SWT.LEFT;
      } else if( ( style & SWT.RIGHT ) != 0 ) {
        result = SWT.RIGHT;
      } else {
        result = SWT.UP;
      }
    } else {
      if( ( style & SWT.LEFT ) != 0 ) {
        result = SWT.LEFT;
      } else if( ( style & SWT.CENTER ) != 0 ) {
        result = SWT.CENTER;
      } else if( ( style & SWT.RIGHT ) != 0 ) {
        result = SWT.RIGHT;
      } else {
        result = SWT.LEFT;
      }
    }
    return result;
  }

  /**
   * Controls how text, images and arrows will be displayed
   * in the receiver. The argument should be one of
   * <code>LEFT</code>, <code>RIGHT</code> or <code>CENTER</code>
   * <!--
   * unless the receiver is an <code>ARROW</code> button, in
   * which case, the argument indicates the direction of
   * the arrow (one of <code>LEFT</code>, <code>RIGHT</code>,
   * <code>UP</code> or <code>DOWN</code>)
   * -->.
   *
   * @param alignment the new alignment
   *
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   */
   // TODO [rst] Remove comments from javadoc when fully implemented
  public void setAlignment( int alignment ) {
    checkWidget();
    if( ( style & SWT.ARROW ) != 0 ) {
      if( ( style & ( SWT.UP | SWT.DOWN | SWT.LEFT | SWT.RIGHT ) ) != 0 ) {
        style &= ~( SWT.UP | SWT.DOWN | SWT.LEFT | SWT.RIGHT );
        style |= alignment & ( SWT.UP | SWT.DOWN | SWT.LEFT | SWT.RIGHT );
      }
    } else if( ( alignment & ( SWT.LEFT | SWT.RIGHT | SWT.CENTER ) ) != 0 ) {
      style &= ~( SWT.LEFT | SWT.RIGHT | SWT.CENTER );
      style |= alignment & ( SWT.LEFT | SWT.RIGHT | SWT.CENTER );
    }
  }

  @Override
  public Point computeSize( int wHint, int hHint, boolean changed ) {
    checkWidget();
    int width = 0;
    int height = 0;
    ButtonThemeAdapter themeAdapter = getThemeAdapter();
    BoxDimensions padding = themeAdapter.getPadding( this );
    if( ( style & SWT.ARROW ) != 0 ) {
      Size arrowSize = themeAdapter.getArrowSize( this );
      width = arrowSize.width;
      height = arrowSize.height;
    } else {
      boolean hasImage = image != null;
      // la forma tiene il posto dell'immagine solo quando l'immagine non c'e': e' la stessa scelta
      // che fa il client quando scrive la cella, e le due misure devono coincidere
      boolean hasShape = !hasImage && iconShape.length() > 0 && iconShapeSize > 0;
      boolean hasText = text.length() > 0;
      Font font = getFont();
      /*
       * Le celle entrano una a una, ognuna con lo stacco che la precede, e il modo di combinarle lo
       * decide la direzione: in fila le larghezze si sommano e vince l'altezza maggiore, in colonna
       * il contrario. E' la stessa disposizione che fa il client, e le due misure devono coincidere.
       */
      int[] cells = new int[ 3 ];
      int pending = 0;
      if( ( style & ( SWT.CHECK | SWT.RADIO ) ) != 0 ) {
        Size checkSize = themeAdapter.getCheckSize( this );
        addCell( cells, vertical, checkSize.width, checkSize.height, 0 );
        pending = themeAdapter.getCheckSpacing( this );
      }
      if( hasImage ) {
        Rectangle imageBounds = image.getBounds();
        addCell( cells, vertical, imageBounds.width, imageBounds.height, pending );
        pending = themeAdapter.getSpacing( this );
      } else if( hasShape ) {
        addCell( cells, vertical, iconShapeSize, iconShapeSize, pending );
        pending = themeAdapter.getSpacing( this );
      }
      if( hasText ) {
        boolean markupEnabled = isMarkupEnabledFor( this );
        int wrapWidth = SWT.DEFAULT;
        if( ( style & SWT.WRAP ) != 0 && wHint != SWT.DEFAULT ) {
          // in colonna il testo ha tutta la larghezza: davanti a lui non c'e' nessuna cella
          int taken = vertical ? 0 : cells[ 0 ] + ( cells[ 2 ] > 0 ? pending : 0 );
          wrapWidth = wHint - taken - ( padding.left + padding.right );
        }
        Point extent = textExtent( font, text, wrapWidth, markupEnabled );
        addCell( cells, vertical, extent.x, extent.y, pending );
      }
      /*
       * Il secondo testo entra nella misura, e con il SUO font: il peso e la dimensione li da'
       * l'elemento di tema Button-SecondaryText, e un "F5" di peso normale accanto a un "Salva" in
       * grassetto e' piu' stretto di quanto sarebbe nel font del pulsante. Senza questa misura la
       * larghezza preferita non basterebbe e il secondo testo verrebbe troncato.
       */
      if( secondaryText.length() > 0 ) {
        /*
         * Il font del controllo se c'e', altrimenti quello del tema: la misura deve essere fatta
         * con lo stesso font che il client scrive sulla cella, e il client fa la stessa scelta -
         * il valore mandato dal server vince su quello dell'appearance.
         */
        Font secondFont = secondaryFont != null
                        ? secondaryFont
                        : themeAdapter.getSecondaryTextFont( this );
        Point extent = textExtent( secondFont,
                                   secondaryText,
                                   SWT.DEFAULT,
                                   isMarkupEnabledFor( this ) );
        addCell( cells, vertical, extent.x, extent.y, themeAdapter.getSecondaryTextSpacing( this ) );
      }
      /*
       * La freccetta del menu: si misura come la spunta di un check - dimensione dal tema piu' lo
       * stacco - perche' e' un segno del widget e non un dato, e quindi la sua dimensione la sa il
       * tema e non chi usa il pulsante.
       */
      if( dropDown ) {
        Size dropDownSize = themeAdapter.getDropDownIconSize( this );
        if( dropDownSize.width > 0 ) {
          /*
           * La cella della freccetta si porta dentro la propria aria, e sta dal lato da cui arriva
           * il resto del pulsante: a sinistra quando le celle sono in fila, sopra quando sono in
           * colonna. E' li' che passa il filo della zona, e il client la dimensiona allo stesso
           * modo.
           */
          int room = themeAdapter.getDropDownIconSpacing( this );
          addCell( cells,
                   vertical,
                   dropDownSize.width + ( vertical ? 0 : room ),
                   dropDownSize.height + ( vertical ? room : 0 ),
                   themeAdapter.getSpacing( this ) );
        }
      }
      width = vertical ? cells[ 1 ] : cells[ 0 ];
      height = vertical ? cells[ 0 ] : cells[ 1 ];
      if( height == 0 ) {
        height = getCharHeight( font );
      }
    }
    width += padding.left + padding.right;
    height += padding.top + padding.bottom;
    if( wHint != SWT.DEFAULT ) {
      width = wHint;
    }
    if( hHint != SWT.DEFAULT ) {
      height = hHint;
    }
    BoxDimensions border = getBorder();
    width += border.left + border.right;
    height += border.top + border.bottom;
    return new Point( width, height );
  }

  /*
   * Una cella entra nella misura. In "cells" stanno, nell'ordine: quanto misura la sequenza nella
   * direzione in cui le celle si susseguono, quanto la cella piu' grande nell'altra direzione, e
   * quante celle ci sono gia' - la prima non ha nessuno stacco davanti a se'.
   */
  private static void addCell( int[] cells, boolean vertical, int width, int height, int gap ) {
    if( cells[ 2 ] > 0 ) {
      cells[ 0 ] += gap;
    }
    cells[ 0 ] += vertical ? height : width;
    cells[ 1 ] = Math.max( cells[ 1 ], vertical ? width : height );
    cells[ 2 ]++;
  }

  /**
   * Adds the listener to the collection of listeners who will
   * be notified when the control is selected, by sending
   * it one of the messages defined in the <code>SelectionListener</code>
   * interface.
   * <p>
   * <code>widgetSelected</code> is called when the control is selected.
   * <code>widgetDefaultSelected</code> is not called.
   * </p>
   *
   * @param listener the listener which should be notified
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - if the listener is null</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see SelectionListener
   * @see #removeSelectionListener
   * @see SelectionEvent
   */
  public void addSelectionListener( SelectionListener listener ) {
    checkWidget();
    if( listener == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    TypedListener typedListener = new TypedListener( listener );
    addListener( SWT.Selection, typedListener );
    addListener( SWT.DefaultSelection, typedListener );
  }

  /**
   * Removes the listener from the collection of listeners who will
   * be notified when the control is selected.
   *
   * @param listener the listener which should no longer be notified
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - if the listener is null</li>
   * </ul>
   * @exception SWTException <ul>
   *    <li>ERROR_WIDGET_DISPOSED - if the receiver has been disposed</li>
   *    <li>ERROR_THREAD_INVALID_ACCESS - if not called from the thread that created the receiver</li>
   * </ul>
   *
   * @see SelectionListener
   * @see #addSelectionListener
   */
  public void removeSelectionListener( SelectionListener listener ) {
    checkWidget();
    if( listener == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    removeListener( SWT.Selection, listener );
    removeListener( SWT.DefaultSelection, listener );
  }

  @Override
  public void setData( String key, Object value ) {
    if( RWT.BADGE.equals( key ) && ( style & SWT.PUSH ) == 0 ) {
      return;
    } else if( RWT.MARKUP_ENABLED.equals( key ) && isMarkupEnabledFor( this ) ) {
      return;
    }
    checkMarkupPrecondition( key, TEXT, () -> text.isEmpty() );
    super.setData( key, value );
  }

  @Override
  @SuppressWarnings( "unchecked" )
  public <T> T getAdapter( Class<T> adapter ) {
    if( adapter == WidgetLCA.class ) {
      return ( T )ButtonLCA.INSTANCE;
    }
    return super.getAdapter( adapter );
  }

  void setDefault( boolean isDefault ) {
    this.isDefault = isDefault;
  }

  boolean getDefault() {
    return isDefault;
  }

  @Override
  boolean isTabGroup() {
    return true;
  }

  @Override
  String getNameText() {
    return getText();
  }

  private static int checkStyle( int style ) {
    int result = checkBits( style,
                            SWT.PUSH,
                            SWT.ARROW,
                            SWT.CHECK,
                            SWT.RADIO,
                            SWT.TOGGLE,
                            0 );
    if( ( result & ( SWT.PUSH | SWT.TOGGLE ) ) != 0 ) {
      result = checkBits( result, SWT.CENTER, SWT.LEFT, SWT.RIGHT, 0, 0, 0 );
    } else if( ( result & ( SWT.CHECK | SWT.RADIO ) ) != 0 ) {
      result = checkBits( result, SWT.LEFT, SWT.RIGHT, SWT.CENTER, 0, 0, 0 );
    } else if( ( result & SWT.ARROW ) != 0 ) {
      result |= SWT.NO_FOCUS;
      result = checkBits( result, SWT.UP, SWT.DOWN, SWT.LEFT, SWT.RIGHT, 0, 0 );
    }
    return result;
  }

  private ButtonThemeAdapter getThemeAdapter() {
    return ( ButtonThemeAdapter )getAdapter( ThemeAdapter.class );
  }

}

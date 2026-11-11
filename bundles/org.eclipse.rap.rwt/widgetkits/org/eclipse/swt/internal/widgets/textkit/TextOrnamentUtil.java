/*******************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 ******************************************************************************/
package org.eclipse.swt.internal.widgets.textkit;

import static org.eclipse.rap.rwt.internal.protocol.JsonUtil.createJsonArray;

import org.eclipse.rap.json.JsonArray;
import org.eclipse.rap.json.JsonObject;
import org.eclipse.rap.json.JsonValue;
import org.eclipse.rap.rwt.internal.textsize.TextSizeUtil;
import org.eclipse.rap.rwt.widgets.TextOrnament;
import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.Font;
import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.graphics.Rectangle;
import org.eclipse.swt.widgets.Text;


/**
 * Le misure degli ornamenti di un campo di testo. Stanno in un posto solo perche' servono due
 * volte e devono dare lo stesso numero: al campo, che ci calcola la propria dimensione preferita,
 * e al protocollo, che manda al client la larghezza di ogni ornamento. Il client non misura
 * niente: dispone quello che riceve.
 */
public final class TextOrnamentUtil {

  /** fra l'icona e il testo dello stesso ornamento */
  public static final int IMAGE_TEXT_GAP = 4;

  /** fra un ornamento e quello che gli sta accanto, che sia un altro ornamento o il testo */
  public static final int SPACING = 6;

  /**
   * La larghezza dell'ornamento da solo: quella dichiarata, oppure icona piu' testo.
   */
  public static int getWidth( Text text, TextOrnament ornament ) {
    if( ornament.getWidth() != SWT.DEFAULT ) {
      return Math.max( 0, ornament.getWidth() );
    }
    int width = getImageWidth( ornament );
    if( ornament.getText().length() > 0 ) {
      Font font = text.getFont();
      width += ( width > 0 ? IMAGE_TEXT_GAP : 0 ) + TextSizeUtil.stringExtent( font, ornament.getText() ).x;
    }
    return width;
  }

  /**
   * Lo spazio che tutti gli ornamenti tolgono a quello che si scrive.
   */
  public static int getTotalWidth( Text text ) {
    int result = 0;
    for( TextOrnament ornament : text.getOrnaments() ) {
      result += getWidth( text, ornament ) + SPACING;
    }
    return result;
  }

  public static int getMaxHeight( Text text ) {
    int result = 0;
    for( TextOrnament ornament : text.getOrnaments() ) {
      result = Math.max( result, getImageHeight( ornament ) );
    }
    return result;
  }

  /**
   * Gli ornamenti come li riceve il client, o <code>null</code> quando non ce ne sono.
   */
  public static JsonValue toJson( Text text ) {
    TextOrnament[] ornaments = text.getOrnaments();
    if( ornaments.length == 0 ) {
      return null;
    }
    JsonArray result = new JsonArray();
    for( TextOrnament ornament : ornaments ) {
      JsonObject json = new JsonObject();
      json.add( "id", ornament.getId() );
      json.add( "position", ornament.getPosition() == SWT.RIGHT ? "right" : "left" );
      json.add( "width", getWidth( text, ornament ) );
      json.add( "image", getImage( ornament ) );
      json.add( "text", ornament.getText() );
      json.add( "toolTip", ornament.getToolTipText() );
      json.add( "style", ornament.getStyle() );
      json.add( "selectable", ornament.getListener() != null );
      result.add( json );
    }
    return result;
  }

  /*
   * la forma del client: [ immagine css, larghezza, altezza ], la stessa di ogni altra immagine.
   * Per un'immagine registrata il primo pezzo e' il suo percorso, per una forma e' l'url css cosi'
   * com'e': il client la riconosce da "url(" e non la avvolge una seconda volta.
   */
  private static JsonValue getImage( TextOrnament ornament ) {
    Image image = ornament.getImage();
    if( image != null ) {
      return createJsonArray( image ).get( 0 );
    }
    if( hasShape( ornament ) ) {
      int size = ornament.getShapeSize();
      return new JsonArray().add( ornament.getShape() ).add( size ).add( size );
    }
    return JsonValue.NULL;
  }

  private static int getImageWidth( TextOrnament ornament ) {
    Image image = ornament.getImage();
    if( image != null ) {
      Rectangle bounds = image.getBounds();
      return bounds.width;
    }
    return hasShape( ornament ) ? ornament.getShapeSize() : 0;
  }

  private static int getImageHeight( TextOrnament ornament ) {
    Image image = ornament.getImage();
    if( image != null ) {
      Rectangle bounds = image.getBounds();
      return bounds.height;
    }
    return hasShape( ornament ) ? ornament.getShapeSize() : 0;
  }

  private static boolean hasShape( TextOrnament ornament ) {
    return ornament.getShape().length() > 0 && ornament.getShapeSize() > 0;
  }

  private TextOrnamentUtil() {
    // prevent instantiation
  }

}

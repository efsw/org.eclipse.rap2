/*******************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/
package org.eclipse.rap.rwt.internal.theme;

import org.eclipse.rap.rwt.internal.theme.css.ConditionalValue;
import org.eclipse.rap.rwt.service.ApplicationContext;


/**
 * Writes the default values of a theme as CSS custom properties on <code>:root</code>, one
 * declaration per themeable element and property:
 *
 * <pre>
 * :root {
 *   --rwt-Button-color: #4a4a4a;
 *   --rwt-Button-background-color: #ffffff;
 *   --rwt-Button-padding: 6px 15px;
 * }
 * </pre>
 *
 * The stylesheet is linked in the startup page, and the client resolves the default value of a
 * themeable property through it - see rwt.theme.ThemeStore. Redefining one of these properties in
 * a stylesheet of the application therefore re-themes the widget, which is what makes a dark
 * variant expressible as a media query.
 * <p>
 * Only the value that applies without any constraint is written. A value that depends on a state
 * or a style flag - the background of a hovered button, say - has no place in a flat list of
 * custom properties and stays in the theme store alone.
 * </p>
 */
public final class CssVariablesWriter {

  private static final String PREFIX = "--rwt-";

  private final ApplicationContext applicationContext;
  private final Theme theme;
  private final CssElement[] elements;

  public CssVariablesWriter( ApplicationContext applicationContext,
                             Theme theme,
                             CssElement[] elements )
  {
    this.applicationContext = applicationContext;
    this.theme = theme;
    this.elements = elements;
  }

  public String createCss() {
    StringBuilder css = new StringBuilder();
    css.append( "/* Custom properties generated from the RAP theme \"" );
    css.append( theme.getId() );
    css.append( "\".\n" );
    css.append( "   Generated file - redefine these properties in a stylesheet of your own\n" );
    css.append( "   instead of editing this one. */\n" );
    css.append( ":root {\n" );
    CssValuesMap valuesMap = theme.getValuesMap();
    for( CssElement element : elements ) {
      appendElement( css, valuesMap, element );
    }
    css.append( "}\n" );
    return css.toString();
  }

  private void appendElement( StringBuilder css, CssValuesMap valuesMap, CssElement element ) {
    String elementName = element.getName();
    if( !isValidIdentifierPart( elementName ) ) {
      // The universal element "*" has no name a custom property could carry. Nothing is lost:
      // what it declares is already folded into the values of every concrete element.
      return;
    }
    for( String propertyName : element.getProperties() ) {
      CssValue value = getDefaultValue( valuesMap, elementName, propertyName );
      if( value != null ) {
        String cssValue = toCssValue( value );
        if( cssValue != null ) {
          css.append( "  " );
          css.append( PREFIX );
          css.append( elementName );
          css.append( '-' );
          css.append( propertyName );
          css.append( ": " );
          css.append( cssValue );
          css.append( ";\n" );
        }
      }
    }
  }

  /**
   * Tells whether a name can be part of a css identifier, so that it can be pasted into the name
   * of a custom property.
   */
  private static boolean isValidIdentifierPart( String name ) {
    if( name.isEmpty() ) {
      return false;
    }
    for( int i = 0; i < name.length(); i++ ) {
      char character = name.charAt( i );
      boolean valid = character == '-'
                   || character == '_'
                   || character >= 'a' && character <= 'z'
                   || character >= 'A' && character <= 'Z'
                   || character >= '0' && character <= '9';
      if( !valid ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the value that applies to an element without any constraint, or <code>null</code> if
   * every value of that property depends on a state.
   */
  private static CssValue getDefaultValue( CssValuesMap valuesMap,
                                           String elementName,
                                           String propertyName )
  {
    ConditionalValue[] values = valuesMap.getValues( elementName, propertyName );
    if( values != null ) {
      for( ConditionalValue conditionalValue : values ) {
        if( conditionalValue.constraints.length == 0 ) {
          return conditionalValue.value;
        }
      }
    }
    return null;
  }

  /**
   * Converts a theme value into CSS. Returns <code>null</code> for the values that have no CSS
   * counterpart, which are left out of the stylesheet: the animations of RWT, and the images
   * whose resource could not be registered.
   */
  private String toCssValue( CssValue value ) {
    if( value instanceof CssAnimation ) {
      return null;
    }
    if( value instanceof CssImage ) {
      return toCssValue( ( CssImage )value );
    }
    if( value instanceof CssCursor ) {
      return toCssValue( ( CssCursor )value );
    }
    return value.toDefaultString();
  }

  private String toCssValue( CssImage image ) {
    // A gradient carries no image file, and CssImage.createGradient marks it as "none" for that
    // reason: the gradient has to be recognized first, or it would be written out as none.
    if( image.isGradient() ) {
      return toCssGradient( image );
    }
    if( image.none ) {
      return "none";
    }
    String location = getResourceLocation( image.getResourcePath( applicationContext ) );
    return location == null ? null : "url( " + location + " )";
  }

  private String toCssValue( CssCursor cursor ) {
    if( !cursor.isCustomCursor() ) {
      return cursor.value;
    }
    String location = getResourceLocation( cursor.getResourcePath( applicationContext ) );
    return location == null ? null : "url( " + location + " ), default";
  }

  private static String toCssGradient( CssImage image ) {
    StringBuilder result = new StringBuilder();
    result.append( "linear-gradient( " );
    result.append( image.vertical ? "to bottom" : "to right" );
    for( int i = 0; i < image.gradientColors.length; i++ ) {
      result.append( ", " );
      result.append( image.gradientColors[ i ] );
      result.append( ' ' );
      result.append( formatPercent( image.gradientPercents[ i ] ) );
      result.append( '%' );
    }
    result.append( " )" );
    return result.toString();
  }

  private static String formatPercent( float percent ) {
    if( percent == ( int )percent ) {
      return String.valueOf( ( int )percent );
    }
    return String.valueOf( percent );
  }

  private String getResourceLocation( String resourcePath ) {
    if( resourcePath == null ) {
      return null;
    }
    return applicationContext.getResourceManager().getLocation( resourcePath );
  }

}

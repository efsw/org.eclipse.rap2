/*******************************************************************************
 * Copyright (c) 2002, 2022 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 *    Frank Appel - replaced singletons and static fields (Bug 337787)
 ******************************************************************************/
package org.eclipse.rap.rwt.internal.service;

import static org.eclipse.rap.rwt.internal.RWTMessages.getMessage;
import static org.eclipse.rap.rwt.internal.service.ContextProvider.getRequest;
import static org.eclipse.rap.rwt.internal.theme.ThemeUtil.getCssValue;
import static org.eclipse.rap.rwt.internal.theme.ThemeUtil.getThemeIdFor;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletResponse;

import org.eclipse.rap.rwt.client.WebClient;
import org.eclipse.rap.rwt.internal.RWTMessages;
import org.eclipse.rap.rwt.internal.application.ApplicationContextImpl;
import org.eclipse.rap.rwt.internal.lifecycle.EntryPointManager;
import org.eclipse.rap.rwt.internal.service.StartupPageTemplate.VariableWriter;
import org.eclipse.rap.rwt.internal.theme.CssColor;
import org.eclipse.rap.rwt.internal.theme.CssImage;
import org.eclipse.rap.rwt.internal.theme.CssValue;
import org.eclipse.rap.rwt.internal.theme.SimpleSelector;
import org.eclipse.rap.rwt.internal.theme.Theme;
import org.eclipse.rap.rwt.internal.util.HTTP;


public class StartupPage {
  private final ApplicationContextImpl applicationContext;
  private final List<String> jsLibraries;
  private final List<String> styleSheets;
  private String clientJsLibrary;
  StartupPageTemplate startupPageTemplate;

  public StartupPage( ApplicationContextImpl applicationContext ) {
    this.applicationContext = applicationContext;
    jsLibraries = new ArrayList<>();
    styleSheets = new ArrayList<>();
  }

  public void activate() {
    startupPageTemplate = new StartupPageTemplate();
  }

  public void deactivate() {
    startupPageTemplate = null;
  }

  public void setClientJsLibrary( String location ) {
    clientJsLibrary = location;
  }

  public void addJsLibrary( String location ) {
    jsLibraries.add( location );
  }

  /**
   * Adds a registered resource to be linked as a stylesheet in the head of the startup page,
   * after the custom properties of the theme. The name is resolved to a location when the page is
   * written, because the resource is only registered when the application context is activated.
   */
  public void addLinkedStyleSheet( String resourceName ) {
    styleSheets.add( resourceName );
  }

  public void send( HttpServletResponse response ) throws IOException {
    StartupPageValueProvider valueProvider = new StartupPageValueProvider();
    setResponseHeaders( response );
    setContentSecurityPolicy( response, valueProvider.getNonceValue() );
    startupPageTemplate.writePage( response.getWriter(), valueProvider );
  }

  static void setResponseHeaders( HttpServletResponse response ) {
    response.setContentType( HTTP.CONTENT_TYPE_HTML );
    response.setCharacterEncoding( HTTP.CHARSET_UTF_8 );
    // TODO [rh] this is a preliminary fix for a behavior that was easily
    //      reproducible in IE but also happened in FF: when restarting a
    //      web app (hit return in location bar), the browser used a cached
    //      version of the index.html *without* sending a request to ask
    //      whether the cached page can be used.
    //      fix for bug 220733: append no-store to the Cache-Control header
    response.addHeader( "Cache-Control", "max-age=0, no-cache, must-revalidate, no-store" );
    response.setHeader( "Pragma", "no-cache" );
    response.setDateHeader( "Expires", 0 );
  }

  void setContentSecurityPolicy( HttpServletResponse response, String nonceValue ) {
    Map<String, String> properties = getCurrentEntryPointProperties();
    setPolicyHeader( response, "Content-Security-Policy", properties.get( WebClient.CSP ), nonceValue );
    setPolicyHeader( response,
                     "Content-Security-Policy-Report-Only",
                     properties.get( WebClient.CSP_REPORT_ONLY ),
                     nonceValue );
  }

  private static void setPolicyHeader( HttpServletResponse response,
                                       String header,
                                       String policy,
                                       String nonceValue )
  {
    if( policy != null ) {
      response.setHeader( header, policy.replaceAll( "nonce-", "nonce-" + nonceValue ) );
    }
  }

  protected void writeTitle( PrintWriter printWriter ) {
    writeEntryPointProperty( printWriter, WebClient.PAGE_TITLE );
  }

  protected void writeBody( PrintWriter printWriter ) {
    writeEntryPointProperty( printWriter, WebClient.BODY_HTML );
  }

  protected void writeHead( PrintWriter printWriter ) {
    Map<String, String> properties = getCurrentEntryPointProperties();
    String favIcon = properties.get( WebClient.FAVICON );
    if( favIcon != null && favIcon.length() > 0 ) {
      String pattern = "<link rel=\"shortcut icon\" type=\"image/x-icon\" href=\"%1$s\" />";
      String favIocnMarkup = String.format( pattern, getResourceLocation( favIcon ) );
      printWriter.write( favIocnMarkup );
    }
    writeWebManifest( printWriter, properties );
    writeThemeColor( printWriter, properties );
    writeStyleSheets( printWriter );
    // Written last, so that an entry point can still override what the stylesheets above declare
    writeEntryPointProperty( printWriter, WebClient.HEAD_HTML );
  }

  protected void writeWebManifest( PrintWriter printWriter, Map<String, String> properties ) {
    String manifest = properties.get( WebClient.WEB_MANIFEST );
    if( manifest != null && manifest.length() > 0 ) {
      printWriter.write( "    <link rel=\"manifest\" href=\"" );
      printWriter.write( getResourceLocation( manifest ) );
      printWriter.write( "\" />\n" );
    }
  }

  /**
   * Writes the color the browser paints its own surroundings with. Unless the entry point names
   * one, it is the background of the Display in the current theme, so that the address bar of a
   * phone and the title bar of an installed application follow the theme without anyone having to
   * repeat the color.
   */
  protected void writeThemeColor( PrintWriter printWriter, Map<String, String> properties ) {
    String themeColor = properties.get( WebClient.THEME_COLOR );
    if( themeColor == null || themeColor.length() == 0 ) {
      themeColor = getDisplayBackgroundColor();
    }
    if( themeColor != null ) {
      printWriter.write( "    <meta name=\"theme-color\" content=\"" );
      printWriter.write( themeColor );
      printWriter.write( "\" />\n" );
    }
  }

  private String getDisplayBackgroundColor() {
    String servletPath = getRequest().getServletPath();
    CssValue value = getCssValue( getThemeIdFor( servletPath ),
                                  "Display",
                                  "background-color",
                                  SimpleSelector.DEFAULT,
                                  null );
    if( value instanceof CssColor ) {
      CssColor color = ( CssColor )value;
      return color.isTransparent() ? null : color.toDefaultString();
    }
    return null;
  }

  /**
   * Writes the link to the custom properties of the current theme, followed by the stylesheets
   * the application has registered. The order is what makes the whole thing work: the generated
   * properties come first, so that a stylesheet of the application can redefine them.
   */
  protected void writeStyleSheets( PrintWriter printWriter ) {
    writeStyleSheetTag( printWriter, getCssVariablesLocation() );
    for( String resourceName : styleSheets ) {
      writeStyleSheetTag( printWriter, getResourceLocation( resourceName ) );
    }
  }

  protected void writeStyleSheetTag( PrintWriter printWriter, String location ) {
    if( location != null ) {
      printWriter.write( "    <link rel=\"stylesheet\" type=\"text/css\" href=\"" );
      printWriter.write( location );
      printWriter.write( "\" />\n" );
    }
  }

  private String getCssVariablesLocation() {
    String themeId = getThemeIdFor( getRequest().getServletPath() );
    Theme theme = applicationContext.getThemeManager().getTheme( themeId );
    return theme == null ? null : theme.getCssVariablesLocation();
  }

  private void writeLibraries( PrintWriter printWriter, String nonceValue ) {
    writeScriptTag( printWriter, clientJsLibrary, nonceValue );
    for( String location : jsLibraries ) {
      writeScriptTag( printWriter, location, nonceValue );
    }
  }

  protected void writeScriptTag( PrintWriter printWriter, String libraryLocation, String nonceValue ) {
    if( libraryLocation != null ) {
      printWriter.write( "    <script type=\"text/javascript\" src=\"" );
      printWriter.write( libraryLocation );
      printWriter.write( "\" nonce=\"" );
      printWriter.write( nonceValue );
      printWriter.write( "\" charset=\"" );
      printWriter.write( HTTP.CHARSET_UTF_8 );
      printWriter.write( "\"></script>\n" );
    }
  }

  protected void writeBackgroundImage( PrintWriter printWriter ) {
    printWriter.write( getBackgroundImageLocation() );
  }

  protected void writeNoScriptMessage( PrintWriter printWriter ) {
    String message = getMessage( RWTMessages.NO_SCRIPT_WARNING, getRequest().getLocale() );
    printWriter.write( message );
  }

  protected void writeAppScript( PrintWriter printWriter ) {
    StringBuilder code = new StringBuilder();
    code.append( "rwt.remote.MessageProcessor.processMessage( " );
    code.append( StartupJson.get() );
    code.append( ");" );
    printWriter.write( code.toString() );
  }

  protected String getBackgroundImageLocation() {
    String resourceName = getBrackgroundImage().getResourcePath( applicationContext );
    return resourceName != null ? getResourceLocation( resourceName ) : "";
  }

  protected CssImage getBrackgroundImage() {
    String servletPath = getRequest().getServletPath();
    return ( CssImage )getCssValue( getThemeIdFor( servletPath ),
                                    "Display",
                                    "background-image",
                                    SimpleSelector.DEFAULT,
                                    null );
  }

  private Map<String, String> getCurrentEntryPointProperties() {
    EntryPointManager entryPointManager = applicationContext.getEntryPointManager();
    return entryPointManager.getEntryPointRegistration( getRequest() ).getProperties();
  }

  private String getResourceLocation( String resourceName ) {
    return applicationContext.getResourceManager().getLocation( resourceName );
  }

  private void writeEntryPointProperty( PrintWriter printWriter, String property ) {
    String title = getCurrentEntryPointProperties().get( property );
    if( title != null ) {
      printWriter.write( title );
    }
  }

  private class StartupPageValueProvider implements VariableWriter {

    private final String nonceValue;

    public StartupPageValueProvider() {
      nonceValue = UUID.randomUUID().toString().replaceAll( "-", "" );
    }

    String getNonceValue() {
      return nonceValue;
    }

    @Override
    public void writeVariable( PrintWriter printWriter, String variableName ) {
      if( variableName.equals( StartupPageTemplate.TOKEN_LIBRARIES ) ) {
        writeLibraries( printWriter, nonceValue );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_TITLE ) ) {
        writeTitle( printWriter );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_BODY ) ) {
        writeBody( printWriter );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_HEADERS ) ) {
        writeHead( printWriter );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_BACKGROUND_IMAGE ) ) {
        writeBackgroundImage( printWriter );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_NO_SCRIPT_MESSAGE ) ) {
        writeNoScriptMessage( printWriter );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_APP_SCRIPT ) ) {
        writeAppScript( printWriter );
      } else if( variableName.equals( StartupPageTemplate.TOKEN_NONCE_VALUE ) ) {
        printWriter.write( nonceValue );
      } else {
        throw new IllegalArgumentException( "Unsupported variable: " + variableName );
      }
    }

  }

}

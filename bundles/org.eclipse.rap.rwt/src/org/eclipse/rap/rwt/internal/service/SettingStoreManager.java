/*******************************************************************************
 * Copyright (c) 2002, 2020 Innoopract Informationssysteme GmbH and others.
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

import java.security.SecureRandom;

import jakarta.servlet.http.Cookie;

import org.eclipse.rap.rwt.internal.util.ParamCheck;
import org.eclipse.rap.rwt.service.UISession;
import org.eclipse.rap.rwt.service.SettingStore;
import org.eclipse.rap.rwt.service.SettingStoreFactory;


public class SettingStoreManager {
  private static final String COOKIE_NAME = "settingStore";
  private static final int COOKIE_MAX_AGE_SEC = 3600 * 24 * 90; // 3 months
  // The store id is the only thing that grants access to a store: whoever presents it in the
  // cookie gets the store. It must therefore be unguessable, not merely unique: 128 random bits.
  private static final int STORE_ID_BYTES = 16;
  private static final int STORE_ID_LENGTH = STORE_ID_BYTES * 2;
  private static final char[] HEX_DIGITS = "0123456789abcdef".toCharArray();
  private static final SecureRandom RANDOM = new SecureRandom();

  private SettingStoreFactory factory;

  public synchronized SettingStore getStore() {
    UISession uiSession = ContextProvider.getUISession();
    String storeId = getStoreId();
    SettingStore result = ( SettingStore )uiSession.getAttribute( storeId );
    if( result == null ) {
      result = factory.createSettingStore( storeId );
      uiSession.setAttribute( storeId, result );
    }
    return result;
  }

  public synchronized void register( SettingStoreFactory factory ) {
    ParamCheck.notNull( factory, "factory" );
    if( hasFactory() ) {
      throw new IllegalStateException( "There is already a SettingStoreFactory registered." );
    }
    this.factory = factory;
  }

  public void deregisterFactory() {
    if( !hasFactory() ) {
      throw new IllegalStateException( "There is no SettingStoreFactory for deregistration." );
    }
    factory = null;
  }

  public synchronized boolean hasFactory() {
    return factory != null;
  }

  private static String getStoreId() {
    UISession uiSession = ContextProvider.getUISession();
    // 1. storeId stored in session? (implies cookie exists)
    String result = ( String )uiSession.getAttribute( COOKIE_NAME );
    if( result == null ) {
      // 2. storeId stored in cookie?
      result = getStoreIdFromCookie();
      if( result == null ) {
        // 3. create new storeId
        result = createUniqueStoreId();
      }
      // (2+3) do refresh cookie, to ensure it expires in COOKIE_MAX_AGE_SEC
      Cookie cookie = new Cookie( COOKIE_NAME, result );
      cookie.setSecure( ContextProvider.getRequest().isSecure() );
      cookie.setMaxAge( COOKIE_MAX_AGE_SEC );
      cookie.setHttpOnly( true );
      ContextProvider.getResponse().addCookie( cookie );
      // (2+3) update storeId stored in session
      // Note: This attribute must be checked for validity to prevent attacks
      // like http://www.owasp.org/index.php/Cross-User_Defacement
      uiSession.setAttribute( COOKIE_NAME, result );
    }
    return result;
  }

  private static String getStoreIdFromCookie() {
    String result = null;
    Cookie[] cookies = ContextProvider.getRequest().getCookies();
    if( cookies != null ) {
      for( int i = 0; result == null && i < cookies.length; i++ ) {
        Cookie cookie = cookies[ i ];
        if( COOKIE_NAME.equals( cookie.getName() ) ) {
          String value = cookie.getValue();
          // Validate cookies to prevent cookie manipulation and related attacks
          // see https://bugs.eclipse.org/bugs/show_bug.cgi?id=275380
          if( isValidCookieValue( value ) ) {
            result = value;
          }
        }
      }
    }
    return result;
  }

  // The id used to be the creation time in milliseconds plus a counter: anyone who could guess
  // when a browser first opened the application could load that browser's store.
  // Lower case hex only: the id becomes a file name, and on a case-insensitive file system two ids
  // that differ only in case would share the same file.
  static String createUniqueStoreId() {
    byte[] bytes = new byte[ STORE_ID_BYTES ];
    RANDOM.nextBytes( bytes );
    char[] chars = new char[ STORE_ID_LENGTH ];
    for( int i = 0; i < bytes.length; i++ ) {
      chars[ i * 2 ] = HEX_DIGITS[ ( bytes[ i ] >> 4 ) & 0x0f ];
      chars[ i * 2 + 1 ] = HEX_DIGITS[ bytes[ i ] & 0x0f ];
    }
    return new String( chars );
  }

  // Only ids in the format created above are accepted. Ids in the old predictable format
  // ("<millis>_<counter>") are rejected on purpose: the browser gets a new random id and starts
  // with an empty store.
  static boolean isValidCookieValue( String value ) {
    if( value == null || value.length() != STORE_ID_LENGTH ) {
      return false;
    }
    for( int i = 0; i < value.length(); i++ ) {
      char ch = value.charAt( i );
      if( !( ch >= '0' && ch <= '9' || ch >= 'a' && ch <= 'f' ) ) {
        return false;
      }
    }
    return true;
  }

}
